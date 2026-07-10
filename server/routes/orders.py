from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Order, Customer, Service
from utils.barcode_utils import generate_qr, generate_individual_item_barcodes

orders_bp = Blueprint('orders', __name__, url_prefix='/api')


@orders_bp.route("/orders", methods=["POST"])
def create_order():
    data = request.json or {}
    required_fields = ["customerName", "customerPhone", "customerEmail", "serviceIds", "total"]
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    if not isinstance(data["serviceIds"], list) or not data["serviceIds"]:
        return jsonify({"error": "serviceIds must be a non-empty list"}), 400

    customer = Customer.query.filter_by(email=data["customerEmail"]).first()
    if not customer:
        customer = Customer(
            name=data["customerName"],
            email=data["customerEmail"],
            phone=data["customerPhone"]
        )
        customer.set_password("defaultpass")
        db.session.add(customer)
        db.session.commit()

    services = Service.query.filter(Service.id.in_(data["serviceIds"])).all()
    if not services or len(services) != len(data["serviceIds"]):
        return jsonify({"error": "One or more services are invalid"}), 400

    total_calculated = sum(s.price for s in services)
    for service in services:
        service.usage_count += 1

    order = Order(
        customer_name=data["customerName"],
        customer_email=data["customerEmail"],
        customer_phone=data["customerPhone"],
        service_id=",".join([s.id for s in services]),
        service_name=",".join([s.name for s in services]),
        pickup_date=data.get("pickupDate", ""),
        special_instructions=data.get("specialInstructions", ""),
        total=total_calculated,
        status="At Store"
    )
    db.session.add(order)
    db.session.commit()

    item_barcodes = generate_individual_item_barcodes(order)
    main_qr_path = generate_qr(order)

    return jsonify({
        "order": order.to_dict(),
        "customer": customer.to_dict(),
        "barcodes": {
            "main_qr": main_qr_path,
            "items": item_barcodes
        }
    }), 201


@orders_bp.route("/orders", methods=["GET"])
def get_orders_by_email():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email query param is required"}), 400
    orders = Order.query.filter_by(customer_email=email).all()
    return jsonify([o.to_dict() for o in orders]), 200


@orders_bp.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict()), 200


@orders_bp.route("/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    order = Order.query.get_or_404(order_id)
    if order.customer_name != customer.name or order.customer_phone != customer.phone:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json or {}
    if "pickupDate" in data:
        order.pickup_date = data["pickupDate"]
    if "specialInstructions" in data:
        order.special_instructions = data["specialInstructions"]
    if "total" in data:
        order.total = float(data["total"])
    if "serviceId" in data:
        service = Service.query.get(data["serviceId"])
        if not service:
            return jsonify({"error": "Invalid service"}), 400
        order.service_id = service.id
        order.service_name = service.name
        service.usage_count += 1
    db.session.commit()
    return jsonify(order.to_dict())


@orders_bp.route("/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email query param is required"}), 400
    order = Order.query.get_or_404(order_id)
    if order.customer_email != email:
        return jsonify({"error": "Unauthorized (email mismatch)"}), 401
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@orders_bp.route("/orders/<order_id>/barcodes", methods=["POST"])
def generate_order_barcodes(order_id):
    try:
        order = Order.query.get_or_404(order_id)
        item_barcodes = generate_individual_item_barcodes(order)

        main_qr_path = generate_qr(order)

        return jsonify({
            "success": True,
            "barcodes": {
                "main_qr": f"/qr/{order.id}.png",
                "items": item_barcodes
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@orders_bp.route("/orders/<order_id>/status", methods=["PUT"])
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.json or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Status is required"}), 400
    valid_statuses = ["At Store", "Processing", "Quality Check", "Ready for Delivery",
                      "Out for Delivery", "Delivered", "Cancelled"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    order.status = new_status
    db.session.commit()
    return jsonify(order.to_dict()), 200

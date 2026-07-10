from flask import Blueprint, jsonify
from models import Order

public_bp = Blueprint('public', __name__, url_prefix='/api/public')


@public_bp.route("/orders/<order_number>", methods=["GET"])
def track_order(order_number):
    order = Order.query.filter_by(id=order_number).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order.to_dict()), 200


@public_bp.route("/orders/<order_number>/tracking", methods=["GET"])
def get_order_tracking(order_number):
    order = Order.query.filter_by(id=order_number).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({
        "id": order.id,
        "customerName": order.customer_name,
        "status": order.status,
        "createdAt": order.created_at.isoformat(),
        "estimatedDelivery": order.pickup_date,
        "total": order.total,
        "services": order.service_name.split(",") if order.service_name else [],
    }), 200


@public_bp.route("/invoice/<order_number>", methods=["GET"])
def get_public_invoice(order_number):
    order = Order.query.filter_by(id=order_number).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({
        "invoiceNumber": order.id,
        "customerName": order.customer_name,
        "customerEmail": order.customer_email,
        "customerPhone": order.customer_phone,
        "customerAddress": order.customer_address,
        "services": order.service_name.split(",") if order.service_name else [],
        "total": order.total,
        "status": order.status,
        "createdAt": order.created_at.isoformat(),
        "pickupDate": order.pickup_date,
        "specialInstructions": order.special_instructions,
    }), 200

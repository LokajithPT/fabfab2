from flask import Blueprint, request, jsonify, send_from_directory
from datetime import datetime, timedelta
from extensions import db
from models import Order, Customer, Service, TransitBatch, Track
import os

misc_bp = Blueprint('misc', __name__)

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


@misc_bp.route("/qr/<filename>")
def serve_qr_code(filename):
    qr_dir = os.path.join(BASE_DIR, "qr")
    return send_from_directory(qr_dir, filename)


@misc_bp.route("/worker/scan", methods=["POST"])
def worker_scan():
    data = request.json
    worker_id = data.get("workerId")
    order_email = data.get("orderEmail")
    status = data.get("orderStatus")
    location = data.get("location")

    if not all([worker_id, order_email, status]):
        return jsonify({"error": "Missing required fields"}), 400

    track = Track(
        worker_id=worker_id,
        order_email=order_email,
        order_status=status,
        location=location
    )
    db.session.add(track)
    db.session.commit()
    return jsonify({"message": "Scan recorded", "track": track.to_dict()}), 201


@misc_bp.route("/api/customers/public", methods=["GET"])
def get_customers_public():
    return jsonify([c.to_dict() for c in Customer.query.all()])


@misc_bp.route("/admin/api/dashboard-summary", methods=["GET"])
def get_dashboard_summary():
    total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
    total_orders = db.session.query(db.func.count(Order.id)).scalar() or 0
    new_customers_last_month = db.session.query(Customer).filter(
        Customer.created_at >= (datetime.utcnow() - timedelta(days=30))
    ).count()
    pending_pickups = db.session.query(Order).filter_by(status="At Store").count()
    total_services = db.session.query(Service).count()
    shipments_in_transit = db.session.query(TransitBatch).filter_by(status="IN_TRANSIT").count()

    order_status_data = []
    statuses = ['At Store', 'Processing', 'Quality Check', 'Ready for Delivery',
                'Delivered', 'Cancelled']
    for status in statuses:
        count = db.session.query(Order).filter_by(status=status).count()
        order_status_data.append({'name': status, 'value': count})

    service_popularity_data = []
    services = Service.query.all()
    for service in services:
        count = db.session.query(Order).filter(
            Order.service_id.like(f"%{service.id}%")
        ).count()
        service_popularity_data.append({'name': service.name, 'orders': count})

    sales_data = []
    for i in range(6):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30 * i)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
        month_revenue = db.session.query(db.func.sum(Order.total)).filter(
            Order.created_at >= month_start,
            Order.created_at <= month_end
        ).scalar() or 0
        sales_data.append({
            'month': month_start.strftime('%b'),
            'revenue': month_revenue
        })
    sales_data.reverse()

    return jsonify({
        "totalRevenue": total_revenue,
        "totalOrders": total_orders,
        "newCustomersLastMonth": new_customers_last_month,
        "pendingPickups": pending_pickups,
        "totalServices": total_services,
        "shipmentsInTransit": shipments_in_transit,
        "orderStatusData": order_status_data,
        "servicePopularityData": service_popularity_data,
        "salesData": sales_data
    }), 200


@misc_bp.route("/admin/api/orders", methods=["GET"])
def get_orders():
    return jsonify([o.to_dict() for o in Order.query.all()])


@misc_bp.route("/admin/api/orders/<string:order_id>", methods=["PUT"])
def update_order_admin(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.json or {}

    if "customerName" in data:
        order.customer_name = data["customerName"]
    if "customerEmail" in data:
        order.customer_email = data["customerEmail"]
    if "customerPhone" in data:
        order.customer_phone = data["customerPhone"]
    if "customerAddress" in data:
        order.customer_address = data["customerAddress"]
    if "pickupDate" in data:
        order.pickup_date = data["pickupDate"]
    if "specialInstructions" in data:
        order.special_instructions = data["specialInstructions"]
    if "total" in data:
        order.total = float(data["total"])
    if "status" in data:
        order.status = data["status"]
    if "serviceId" in data:
        service_ids = [s.strip() for s in data["serviceId"].split(",")]
        services = Service.query.filter(Service.id.in_(service_ids)).all()
        if not services or len(services) != len(service_ids):
            return jsonify({"error": "One or more services are invalid"}), 400
        order.service_id = ",".join([s.id for s in services])
        order.service_name = ",".join([s.name for s in services])
        order.total = sum(s.price for s in services)
        for service in services:
            service.usage_count += 1

    db.session.commit()
    return jsonify(order.to_dict()), 200


@misc_bp.route("/admin/api/orders/<string:order_id>", methods=["DELETE"])
def delete_order_admin(order_id):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted"}), 200


@misc_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200


@misc_bp.route("/admin", defaults={"path": ""})
@misc_bp.route("/admin/<path:path>")
def serve_admin(path):
    from flask import session, redirect, url_for
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    dist = os.path.join(BASE_DIR, "reactshit")
    if path and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    return send_from_directory(dist, "index.html")

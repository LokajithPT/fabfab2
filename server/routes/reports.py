from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from extensions import db
from models import Order, Customer
from routes.auth import admin_login_required

reports_bp = Blueprint('reports', __name__, url_prefix='/admin/api/reports')


@reports_bp.route("/summary", methods=["GET"])
@admin_login_required
def get_summary_report():
    days = request.args.get("days", 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    orders = Order.query.filter(Order.created_at >= since).all()
    total_orders = len(orders)
    total_revenue = sum(o.total for o in orders if o.total)
    avg_order = total_revenue / total_orders if total_orders else 0

    completed = sum(1 for o in orders if o.status == "Delivered")
    cancelled = sum(1 for o in orders if o.status == "Cancelled")
    pending = total_orders - completed - cancelled

    new_customers = Customer.query.filter(Customer.created_at >= since).count()

    return jsonify({
        "period": f"Last {days} days",
        "totalOrders": total_orders,
        "totalRevenue": total_revenue,
        "averageOrderValue": round(avg_order, 2),
        "completed": completed,
        "cancelled": cancelled,
        "pending": pending,
        "newCustomers": new_customers,
    }), 200


@reports_bp.route("/orders", methods=["GET"])
@admin_login_required
def get_orders_report():
    days = request.args.get("days", 7, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    orders = Order.query.filter(Order.created_at >= since).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders]), 200

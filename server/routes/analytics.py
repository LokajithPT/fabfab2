from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from extensions import db
from models import Order, Customer, Service, TransitBatch
from routes.auth import admin_login_required

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route("/admin/api/analytics/kpi", methods=["GET"])
@admin_login_required
def get_kpi():
    total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
    total_orders = db.session.query(db.func.count(Order.id)).scalar() or 0
    total_customers = db.session.query(db.func.count(Customer.id)).scalar() or 0
    total_services = db.session.query(db.func.count(Service.id)).scalar() or 0
    avg_order_value = total_revenue / total_orders if total_orders else 0
    pending_orders = db.session.query(Order).filter(
        Order.status.in_(["At Store", "Processing"])
    ).count()

    return jsonify({
        "totalRevenue": total_revenue,
        "totalOrders": total_orders,
        "totalCustomers": total_customers,
        "totalServices": total_services,
        "averageOrderValue": round(avg_order_value, 2),
        "pendingOrders": pending_orders,
    }), 200


@analytics_bp.route("/admin/api/analytics/revenue-trend", methods=["GET"])
@admin_login_required
def get_revenue_trend():
    data = []
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
        data.append({
            "month": month_start.strftime("%b"),
            "revenue": month_revenue
        })
    data.reverse()
    return jsonify(data), 200


@analytics_bp.route("/admin/api/analytics/order-status", methods=["GET"])
@admin_login_required
def get_order_status_distribution():
    statuses = ["At Store", "Processing", "Quality Check", "Ready for Delivery",
                "Out for Delivery", "Delivered", "Cancelled"]
    data = []
    for status in statuses:
        count = db.session.query(Order).filter_by(status=status).count()
        if count > 0:
            data.append({"name": status, "value": count})
    return jsonify(data), 200


@analytics_bp.route("/admin/api/analytics/service-popularity", methods=["GET"])
@admin_login_required
def get_service_popularity():
    services = Service.query.all()
    data = []
    for service in services:
        count = db.session.query(Order).filter(
            Order.service_id.like(f"%{service.id}%")
        ).count()
        data.append({"name": service.name, "orders": count})
    return jsonify(data), 200

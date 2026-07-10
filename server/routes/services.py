from flask import Blueprint, request, jsonify
from extensions import db
from models import Service
from routes.auth import admin_login_required

services_bp = Blueprint('services', __name__)


@services_bp.route("/api/services", methods=["GET"])
def get_services():
    services = Service.query.all()
    return jsonify([s.to_dict() for s in services]), 200


@services_bp.route("/admin/api/services", methods=["GET"])
@admin_login_required
def admin_get_services():
    return jsonify([s.to_dict() for s in Service.query.all()])


@services_bp.route("/admin/api/services", methods=["POST"])
@admin_login_required
def create_service():
    data = request.json or {}
    if not data.get("name") or data.get("price") is None:
        return jsonify({"error": "Missing fields"}), 400
    service = Service(
        name=data["name"],
        price=float(data["price"]),
        duration=data.get("duration"),
        category=data.get("category")
    )
    db.session.add(service)
    db.session.commit()
    return jsonify(service.to_dict()), 201


@services_bp.route("/admin/api/services/<service_id>", methods=["PUT"])
@admin_login_required
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    data = request.json or {}
    service.name = data.get("name", service.name)
    if "price" in data:
        service.price = float(data["price"])
    service.duration = data.get("duration", service.duration)
    service.category = data.get("category", service.category)
    service.status = data.get("status", service.status)
    db.session.commit()
    return jsonify(service.to_dict()), 200


@services_bp.route("/admin/api/services/<service_id>", methods=["DELETE"])
@admin_login_required
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

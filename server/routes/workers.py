from flask import Blueprint, request, jsonify
from extensions import db
from models import Worker
from routes.auth import admin_login_required

workers_bp = Blueprint('workers', __name__, url_prefix='/admin/api/workers')


@workers_bp.route("", methods=["GET"])
@admin_login_required
def get_workers():
    workers = Worker.query.all()
    return jsonify([w.to_dict() for w in workers]), 200


@workers_bp.route("", methods=["POST"])
@admin_login_required
def create_worker():
    data = request.json or {}
    required = ["name", "email", "password"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    if Worker.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email exists"}), 400

    worker = Worker(name=data["name"], email=data["email"])
    worker.set_password(data["password"])
    db.session.add(worker)
    db.session.commit()
    return jsonify(worker.to_dict()), 201


@workers_bp.route("/<int:worker_id>", methods=["PUT"])
@admin_login_required
def update_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    data = request.json or {}
    worker.name = data.get("name", worker.name)
    worker.email = data.get("email", worker.email)
    if "password" in data:
        worker.set_password(data["password"])
    db.session.commit()
    return jsonify(worker.to_dict()), 200


@workers_bp.route("/<int:worker_id>", methods=["DELETE"])
@admin_login_required
def delete_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    db.session.delete(worker)
    db.session.commit()
    return jsonify({"message": "Worker deleted"}), 200

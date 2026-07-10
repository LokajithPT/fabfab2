from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db
from models import Order, TransitBatch, TransitOrder
from routes.auth import admin_login_required

transit_bp = Blueprint('transit', __name__)


# ---------------- ADMIN TRANSIT ---------------- #

@transit_bp.route("/admin/api/transit-batches", methods=["GET"])
@admin_login_required
def get_transit_batches():
    batches = TransitBatch.query.order_by(TransitBatch.created_at.desc()).all()
    results = []
    for batch in batches:
        batch_dict = batch.to_dict()
        transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
        order_ids = [to.order_id for to in transit_orders]
        orders = Order.query.filter(Order.id.in_(order_ids)).all()
        batch_dict['orders'] = [o.to_dict() for o in orders]
        results.append(batch_dict)
    return jsonify(results), 200


@transit_bp.route("/admin/api/transit-batches", methods=["POST"])
@admin_login_required
def create_transit_batch():
    data = request.json or {}
    order_ids = data.get("order_ids")
    transit_type = data.get("type")
    created_by = data.get("created_by")

    if not all([order_ids, transit_type, created_by]):
        return jsonify({"error": "Missing required fields"}), 400

    if transit_type == "FACTORY_TO_STORE":
        existing_transits = TransitOrder.query.join(TransitBatch).filter(
            TransitOrder.order_id.in_(order_ids),
            TransitBatch.type == "FACTORY_TO_STORE",
            TransitBatch.status != "COMPLETED"
        ).first()

        if existing_transits:
            return jsonify({
                "error": "A factory to store transit for one or more of these orders is already in progress."
            }), 400

    id_prefix = "S2F" if transit_type == "STORE_TO_FACTORY" else "F2S"
    batch_transit_id = f"{id_prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_batch = TransitBatch(
        transit_id=batch_transit_id,
        type=transit_type,
        created_by=created_by
    )
    db.session.add(new_batch)
    db.session.commit()

    for order_id in order_ids:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": f"Order {order_id} not found"}), 404
        transit_order = TransitOrder(transit_batch_id=new_batch.id, order_id=order.id)
        db.session.add(transit_order)

    db.session.commit()
    return jsonify(new_batch.to_dict()), 201


@transit_bp.route("/admin/api/transit-batches/<int:batch_id>", methods=["GET"])
@admin_login_required
def get_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    batch_dict = batch.to_dict()
    batch_dict['orders'] = [o.to_dict() for o in orders]
    return jsonify(batch_dict), 200


@transit_bp.route("/admin/api/transit-batches/<int:batch_id>/initiate", methods=["PUT"])
@admin_login_required
def initiate_transit(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "PENDING":
        return jsonify({"error": "Transit can only be initiated from PENDING state"}), 400

    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    new_status = "In Transit to Factory" if batch.type == "STORE_TO_FACTORY" else "In Transit to Store"
    for order in orders:
        order.status = new_status

    batch.status = "IN_TRANSIT"
    db.session.commit()
    return jsonify(batch.to_dict()), 200


@transit_bp.route("/admin/api/transit-batches/<int:batch_id>/receive", methods=["PUT"])
@admin_login_required
def receive_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "IN_TRANSIT":
        return jsonify({"error": "Can only receive a batch that is IN_TRANSIT"}), 400

    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    new_status = "At Factory" if batch.type == "STORE_TO_FACTORY" else "At Store"
    for order in orders:
        order.status = new_status

    batch.status = "ARRIVED"
    db.session.commit()
    return jsonify(batch.to_dict()), 200


@transit_bp.route("/admin/api/transit-batches/<int:batch_id>/complete", methods=["PUT"])
@admin_login_required
def complete_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "ARRIVED":
        return jsonify({"error": "Can only complete a batch that has ARRIVED"}), 400

    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    if batch.type == "STORE_TO_FACTORY":
        for order in orders:
            order.status = "Processing"
    else:
        for order in orders:
            order.status = "Ready for Delivery"

    batch.status = "COMPLETED"
    batch.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(batch.to_dict()), 200


# ---------------- EMPLOYEE TRANSIT ---------------- #

@transit_bp.route("/employee/api/transit-batches", methods=["GET"])
def get_employee_transit_batches():
    batches = TransitBatch.query.order_by(TransitBatch.created_at.desc()).all()
    results = []
    for batch in batches:
        batch_dict = batch.to_dict()
        transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
        order_ids = [to.order_id for to in transit_orders]
        orders = Order.query.filter(Order.id.in_(order_ids)).all()
        batch_dict['orders'] = [o.to_dict() for o in orders]
        results.append(batch_dict)
    return jsonify(results), 200


@transit_bp.route("/employee/api/orders", methods=["GET"])
def get_employee_orders():
    status_q = request.args.get("status")
    all_flag = request.args.get("all")

    if all_flag == "1":
        orders = Order.query.order_by(Order.created_at.desc()).all()
    elif status_q:
        orders = Order.query.filter_by(status=status_q).order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(status="At Store").order_by(Order.created_at.desc()).all()

    return jsonify([o.to_dict() for o in orders]), 200


@transit_bp.route("/employee/api/transit-batches", methods=["POST"])
def create_employee_transit_batch():
    data = request.json or {}
    order_ids = data.get("order_ids")
    transit_type = data.get("type")
    created_by = data.get("created_by")

    if not all([order_ids, transit_type, created_by]):
        return jsonify({"error": "Missing required fields"}), 400

    if transit_type == "FACTORY_TO_STORE":
        existing_transits = TransitOrder.query.join(TransitBatch).filter(
            TransitOrder.order_id.in_(order_ids),
            TransitBatch.type == "FACTORY_TO_STORE",
            TransitBatch.status != "COMPLETED"
        ).first()

        if existing_transits:
            return jsonify({
                "error": "A factory to store transit for one or more of these orders is already in progress."
            }), 400

    id_prefix = "S2F" if transit_type == "STORE_TO_FACTORY" else "F2S"
    batch_transit_id = f"{id_prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_batch = TransitBatch(
        transit_id=batch_transit_id,
        type=transit_type,
        created_by=created_by
    )
    db.session.add(new_batch)
    db.session.commit()

    for order_id in order_ids:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": f"Order {order_id} not found"}), 404
        transit_order = TransitOrder(transit_batch_id=new_batch.id, order_id=order.id)
        db.session.add(transit_order)

    db.session.commit()
    return jsonify(new_batch.to_dict()), 201


@transit_bp.route("/employee/api/transit-batches/<int:batch_id>", methods=["GET"])
def get_employee_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    batch_dict = batch.to_dict()
    batch_dict['orders'] = [o.to_dict() for o in orders]
    return jsonify(batch_dict), 200


@transit_bp.route("/employee/api/transit-batches/<int:batch_id>/initiate", methods=["PUT"])
def initiate_employee_transit(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "PENDING":
        return jsonify({"error": "Transit can only be initiated from PENDING state"}), 400

    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    new_status = "In Transit to Factory" if batch.type == "STORE_TO_FACTORY" else "In Transit to Store"
    for order in orders:
        order.status = new_status

    batch.status = "IN_TRANSIT"
    db.session.commit()
    return jsonify(batch.to_dict()), 200


@transit_bp.route("/employee/api/transit-batches/<int:batch_id>/receive", methods=["PUT"])
def receive_employee_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "IN_TRANSIT":
        return jsonify({"error": "Can only receive a batch that is IN_TRANSIT"}), 400

    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    new_status = "At Factory" if batch.type == "STORE_TO_FACTORY" else "At Store"
    for order in orders:
        order.status = new_status

    batch.status = "ARRIVED"
    db.session.commit()
    return jsonify(batch.to_dict()), 200


@transit_bp.route("/employee/api/transit-batches/<int:batch_id>/complete", methods=["PUT"])
def complete_employee_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    if batch.status != "ARRIVED":
        return jsonify({"error": "Can only complete a batch that has ARRIVED"}), 400

    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    if batch.type == "STORE_TO_FACTORY":
        for order in orders:
            order.status = "Processing"
    else:
        for order in orders:
            order.status = "Ready for Delivery"

    batch.status = "COMPLETED"
    batch.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(batch.to_dict()), 200

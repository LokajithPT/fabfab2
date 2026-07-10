from flask import Blueprint, request, jsonify
from extensions import db
from models import Booking, Order, Customer, Service
import uuid

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


@bookings_bp.route("", methods=["POST"])
def create_booking():
    data = request.json or {}
    required = ["customerName", "customerEmail", "customerPhone", "serviceIds"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    if not isinstance(data["serviceIds"], list) or not data["serviceIds"]:
        return jsonify({"error": "serviceIds must be a non-empty list"}), 400

    booking = Booking(
        customer_name=data["customerName"],
        customer_email=data["customerEmail"],
        customer_phone=data["customerPhone"],
        customer_address=data.get("customerAddress", ""),
        service_ids=",".join(data["serviceIds"]),
        preferred_date=data.get("preferredDate", ""),
        preferred_time=data.get("preferredTime", ""),
        notes=data.get("notes", ""),
        status="pending"
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking.to_dict()), 201


@bookings_bp.route("", methods=["GET"])
def get_bookings():
    status = request.args.get("status")
    query = Booking.query.order_by(Booking.created_at.desc())
    if status:
        query = query.filter_by(status=status)
    bookings = query.all()
    return jsonify([b.to_dict() for b in bookings]), 200


@bookings_bp.route("/<int:booking_id>", methods=["GET"])
def get_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    return jsonify(booking.to_dict()), 200


@bookings_bp.route("/<int:booking_id>/status", methods=["PUT"])
def update_booking_status(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    data = request.json or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Status is required"}), 400
    valid = ["pending", "confirmed", "cancelled", "converted"]
    if new_status not in valid:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid)}"}), 400
    booking.status = new_status
    db.session.commit()
    return jsonify(booking.to_dict()), 200


@bookings_bp.route("/<int:booking_id>/convert", methods=["POST"])
def convert_booking_to_order(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.status == "converted":
        return jsonify({"error": "Booking already converted"}), 400

    service_ids = booking.service_ids.split(",") if booking.service_ids else []
    services = Service.query.filter(Service.id.in_(service_ids)).all() if service_ids else []

    total = sum(s.price for s in services)

    customer = Customer.query.filter_by(email=booking.customer_email).first()
    if not customer:
        customer = Customer(
            name=booking.customer_name,
            email=booking.customer_email,
            phone=booking.customer_phone
        )
        customer.set_password("defaultpass")
        db.session.add(customer)
        db.session.commit()

    for service in services:
        service.usage_count += 1

    order = Order(
        customer_name=booking.customer_name,
        customer_email=booking.customer_email,
        customer_phone=booking.customer_phone,
        customer_address=booking.customer_address,
        service_id=",".join([s.id for s in services]),
        service_name=",".join([s.name for s in services]),
        pickup_date=booking.preferred_date,
        special_instructions=booking.notes,
        total=total,
        status="At Store"
    )
    db.session.add(order)
    db.session.commit()

    booking.status = "converted"
    booking.converted_order_id = order.id
    db.session.commit()

    return jsonify({
        "order": order.to_dict(),
        "booking": booking.to_dict()
    }), 201


@bookings_bp.route("/<int:booking_id>", methods=["DELETE"])
def delete_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.status == "converted":
        return jsonify({"error": "Cannot delete a converted booking"}), 400
    db.session.delete(booking)
    db.session.commit()
    return jsonify({"message": "Booking deleted"}), 200

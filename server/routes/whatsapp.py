from flask import Blueprint, request, jsonify
from models import Order

whatsapp_bp = Blueprint('whatsapp', __name__, url_prefix='/api/whatsapp')


@whatsapp_bp.route("/send-invoice", methods=["POST"])
def send_invoice():
    data = request.json or {}
    order_id = data.get("orderId")
    phone = data.get("phone")

    if not order_id or not phone:
        return jsonify({"error": "orderId and phone are required"}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    message = (
        f"FabZ Clean - Invoice #{order.id}\n"
        f"Customer: {order.customer_name}\n"
        f"Services: {order.service_name}\n"
        f"Total: Rs {order.total:.2f}\n"
        f"Status: {order.status}\n"
        f"Thank you for choosing FabZ Clean!"
    )

    return jsonify({
        "success": True,
        "message": "Invoice sent via WhatsApp",
        "to": phone,
        "body": message
    }), 200


@whatsapp_bp.route("/send-bill", methods=["POST"])
def send_bill():
    data = request.json or {}
    order_id = data.get("orderId")
    phone = data.get("phone")

    if not order_id or not phone:
        return jsonify({"error": "orderId and phone are required"}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    message = (
        f"FabZ Clean - Order Confirmation\n"
        f"Order: #{order.id}\n"
        f"Customer: {order.customer_name}\n"
        f"Services: {order.service_name}\n"
        f"Total: Rs {order.total:.2f}\n"
        f"Pickup: {order.pickup_date or 'Not scheduled'}\n"
        f"Status: {order.status}\n"
        f"Track at: fabzclean.com/track/{order.id}"
    )

    return jsonify({
        "success": True,
        "message": "Bill sent via WhatsApp",
        "to": phone,
        "body": message
    }), 200

from flask import Blueprint, request, jsonify
from extensions import db
from routes.auth import admin_login_required

settings_bp = Blueprint('settings', __name__, url_prefix='/admin/api/settings')


@settings_bp.route("", methods=["GET"])
@admin_login_required
def get_settings():
    return jsonify({
        "storeName": "FabZ Clean",
        "storeAddress": "",
        "storePhone": "",
        "storeEmail": "",
        "gstEnabled": False,
        "gstin": "",
        "defaultInvoiceNote": "Thank you for your business!",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    }), 200


@settings_bp.route("", methods=["PUT"])
@admin_login_required
def update_settings():
    data = request.json or {}
    return jsonify({
        "message": "Settings updated",
        "settings": data
    }), 200

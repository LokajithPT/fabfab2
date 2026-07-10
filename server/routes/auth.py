from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template
from flask_jwt_extended import create_access_token
from extensions import db
from models import Worker, Customer
from functools import wraps

auth_bp = Blueprint('auth', __name__)

ADMIN_USER = "fabclean"
ADMIN_PASS = "fabzclean"


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper


@auth_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            if data.get("username") == ADMIN_USER and data.get("password") == ADMIN_PASS:
                session["admin_logged_in"] = True
                session.permanent = True
                return jsonify({"message": "Admin login successful"}), 200
            return jsonify({"error": "Invalid credentials"}), 401
        else:
            username = request.form.get("username")
            password = request.form.get("password")
            if username == ADMIN_USER and password == ADMIN_PASS:
                session["admin_logged_in"] = True
                session.permanent = True
                return redirect(url_for("serve_admin"))
            return render_template("lokesh.html", error="Invalid credentials")
    return render_template("lokesh.html")


@auth_bp.route("/admin/logout", methods=["POST"])
@admin_login_required
def admin_logout():
    session.pop("admin_logged_in", None)
    return jsonify({"message": "Admin logged out"}), 200


@auth_bp.route("/employee/login", methods=["POST"])
def employee_login():
    if not request.is_json:
        return jsonify({"error": "Expected JSON"}), 400

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    worker = Worker.query.filter_by(email=email).first()
    if not worker or not worker.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity={
        "id": worker.id,
        "email": worker.email,
        "name": worker.name
    })

    return jsonify({"token": token, "worker": worker.to_dict()}), 200


@auth_bp.route("/employee/change-password", methods=["POST"])
def change_password():
    data = request.get_json()
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required"}), 400

    worker = Worker.query.filter_by(email=email).first()
    if not worker:
        return jsonify({"error": "Worker not found"}), 404

    worker.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated successfully"}), 200


@auth_bp.route("/auth/signup", methods=["POST"])
def customer_signup():
    data = request.json or {}
    required = ["name", "email", "phone", "password"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    if Customer.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email exists"}), 400

    customer = Customer(name=data["name"], email=data["email"], phone=data["phone"])
    customer.set_password(data["password"])
    db.session.add(customer)
    db.session.commit()

    token = create_access_token(identity={
        "id": customer.id,
        "email": customer.email,
        "name": customer.name
    })

    return jsonify({"token": token, "customer": customer.to_dict()}), 201


@auth_bp.route("/auth/login", methods=["POST"])
def customer_login():
    if not request.is_json:
        return jsonify({"error": "Expected JSON"}), 400

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    customer = Customer.query.filter_by(email=email).first()
    if not customer or not customer.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity={
        "id": customer.id,
        "email": customer.email,
        "name": customer.name
    })

    return jsonify({"token": token, "customer": customer.to_dict()}), 200

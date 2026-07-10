from flask import Blueprint, request, jsonify
import pandas as pd
from extensions import db
from models import Customer, Order
from routes.auth import admin_login_required

customers_bp = Blueprint('customers', __name__, url_prefix='/admin/api/customers')


@customers_bp.route("", methods=["GET"])
@admin_login_required
def get_customers():
    customers_query = db.session.query(
        Customer,
        db.func.count(Order.id).label('total_orders'),
        db.func.sum(Order.total).label('total_spent')
    ).outerjoin(Order, Customer.email == Order.customer_email) \
     .group_by(Customer.id) \
     .all()

    customers_data = []
    for customer, total_orders, total_spent in customers_query:
        customer.total_orders = total_orders
        customer.total_spent = total_spent if total_spent is not None else 0.0
        customers_data.append(customer.to_dict())

    return jsonify(customers_data), 200


@customers_bp.route("", methods=["POST"])
def create_customer():
    data = request.json or {}
    required = ["name", "email", "phone"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    if Customer.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email exists"}), 400
    customer = Customer(name=data["name"], email=data["email"], phone=data["phone"])
    customer.set_password("defaultpass")
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201


@customers_bp.route("/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.json or {}
    customer.name = data.get("name", customer.name)
    customer.email = data.get("email", customer.email)
    customer.phone = data.get("phone", customer.phone)
    db.session.commit()
    return jsonify(customer.to_dict()), 200


@customers_bp.route("/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted"}), 200


@customers_bp.route("/import", methods=["POST"])
def import_customers():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if not (file.filename.endswith('.csv') or
                file.filename.endswith('.xlsx') or
                file.filename.endswith('.xls')):
            return jsonify({"error": "Invalid file format. Please upload CSV or Excel file"}), 400

        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        required_columns = ['name', 'email', 'phone']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                "error": f"Missing required columns: {', '.join(missing_columns)}"
            }), 400

        imported_count = 0
        skipped_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                if pd.isna(row['name']) or pd.isna(row['email']) or pd.isna(row['phone']):
                    skipped_count += 1
                    continue

                existing_customer = Customer.query.filter_by(email=row['email']).first()
                if existing_customer:
                    skipped_count += 1
                    continue

                customer = Customer(
                    name=str(row['name']).strip(),
                    email=str(row['email']).strip(),
                    phone=str(row['phone']).strip()
                )
                customer.set_password("defaultpass")

                if 'address' in df.columns and not pd.isna(row['address']):
                    customer.address = str(row['address']).strip()
                if 'notes' in df.columns and not pd.isna(row['notes']):
                    customer.notes = str(row['notes']).strip()
                if 'status' in df.columns and not pd.isna(row['status']):
                    customer.status = str(row['status']).strip()

                db.session.add(customer)
                imported_count += 1

            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                skipped_count += 1

        db.session.commit()

        return jsonify({
            "message": "Import completed successfully",
            "imported": imported_count,
            "skipped": skipped_count,
            "errors": errors
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Import failed: {str(e)}"}), 500

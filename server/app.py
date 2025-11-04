import os
import barcode
from barcode.writer import ImageWriter
import uuid
from datetime import datetime
from functools import wraps
from flask_cors import CORS
from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory,
    session,
    redirect,
    url_for,
    render_template,
)

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------- CONFIG ---------------- #
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DIST_FOLDER = os.path.join(BASE_DIR, "reactshit")  # react admin build

TEMPLATE_FOLDER = os.path.join(BASE_DIR, "templates")  # login templates

app = Flask(
    __name__,
    static_folder=DIST_FOLDER,
    static_url_path="",
    template_folder=TEMPLATE_FOLDER,
)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///fabclean.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "super-secret-key-loki"
app.config["JWT_SECRET_KEY"] = "super-jwt-secret-loki"

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)
# ---------------- HELPERS ---------------- #
def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper





def generate_qr(order):
    qr_dir = os.path.join(BASE_DIR, "qr")
    os.makedirs(qr_dir, exist_ok=True)

    # Encode only the order ID in the barcode
    order_id = order.id

    # Generate barcode
    EAN = barcode.get_barcode_class('code128')
    ean = EAN(order_id, writer=ImageWriter())
    
    # Save barcode
    qr_path = os.path.join(qr_dir, f"{order.id}")
    ean.save(qr_path)

    return f"{qr_path}.png"

# ---------------- MODELS ---------------- #
class Worker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "createdAt": self.created_at.isoformat(),
        }

class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, nullable=False)      # ID of worker who scanned
    order_email = db.Column(db.String(120), nullable=False) # Email from order
    order_status = db.Column(db.String(50), nullable=False) # e.g., "Picked Up", "Delivered"
    location = db.Column(db.String(100))                  # optional location info
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workerId": self.worker_id,
            "orderEmail": self.order_email,
            "orderStatus": self.order_status,
            "location": self.location,
            "scannedAt": self.scanned_at.isoformat(),
        }


class Service(db.Model):
    id = db.Column(db.String(20), primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    duration = db.Column(db.String(50))
    status = db.Column(db.String(50), default="Active")
    usage_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "duration": self.duration,
            "status": self.status,
            "usage_count": self.usage_count,
        }

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "createdAt": self.created_at.isoformat(),
        }

class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.String(20), primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    service_id = db.Column(db.String(20), db.ForeignKey("service.id"))
    service_name = db.Column(db.String(100))
    pickup_date = db.Column(db.String(50))
    special_instructions = db.Column(db.Text)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="At Store", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "customerName": self.customer_name,
            "customerEmail": self.customer_email,
            "customerPhone": self.customer_phone,
            "serviceId": self.service_id.split(",") if self.service_id else [],
            "service": self.service_name.split(",") if self.service_name else [],
            "pickupDate": self.pickup_date,
            "specialInstructions": self.special_instructions,
            "total": self.total,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
        }

class TransitBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transit_id = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # STORE_TO_FACTORY or FACTORY_TO_STORE
    status = db.Column(db.String(50), default="PENDING", nullable=False)
    created_by = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "transitId": self.transit_id,
            "type": self.type,
            "status": self.status,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat(),
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }

class TransitOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transit_batch_id = db.Column(db.Integer, db.ForeignKey('transit_batch.id'), nullable=False)
    order_id = db.Column(db.String(20), db.ForeignKey('orders.id'), nullable=False)

#worker shit 


@app.route("/qr/<filename>")
def serve_qr_code(filename):
    """Serve QR code images"""
    qr_dir = os.path.join(BASE_DIR, "qr")
    return send_from_directory(qr_dir, filename)





@app.route("/worker/scan", methods=["POST"])
def worker_scan():
    data = request.json
    worker_id = data.get("workerId")
    order_email = data.get("orderEmail")
    status = data.get("orderStatus")
    location = data.get("location")

    if not all([worker_id, order_email, status]):
        return jsonify({"error": "Missing required fields"}), 400

    track = Track(
        worker_id=worker_id,
        order_email=order_email,
        order_status=status,
        location=location
    )
    db.session.add(track)
    db.session.commit()
    return jsonify({"message": "Scan recorded", "track": track.to_dict()}), 201

# ---------------- CUSTOMER AUTH ---------------- #
@app.route("/auth/signup", methods=["POST"])
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

@app.route("/auth/login", methods=["POST"])
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

# ---------------- CUSTOMER ORDERS ---------------- #
@app.route("/api/orders", methods=["POST"])
def create_order_auto_customer():
    data = request.json or {}
    required_fields = ["customerName", "customerPhone", "customerEmail", "serviceIds", "total"]
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    if not isinstance(data["serviceIds"], list) or not data["serviceIds"]:
        return jsonify({"error": "serviceIds must be a non-empty list"}), 400

    # 1️⃣ Check if customer exists, create if not
    customer = Customer.query.filter_by(email=data["customerEmail"]).first()
    if not customer:
        customer = Customer(
            name=data["customerName"],
            email=data["customerEmail"],
            phone=data["customerPhone"]
        )
        customer.set_password("defaultpass")  # Or generate random temp password
        db.session.add(customer)
        db.session.commit()

    # 2️⃣ Create the order
    services = Service.query.filter(Service.id.in_(data["serviceIds"])).all()
    if not services or len(services) != len(data["serviceIds"]):
        return jsonify({"error": "One or more services are invalid"}), 400

    total_calculated = sum(s.price for s in services)

    for service in services:
        service.usage_count += 1

    order = Order(
        customer_name=data["customerName"],
        customer_email=data["customerEmail"],
        customer_phone=data["customerPhone"],
        service_id=",".join([s.id for s in services]),
        service_name=",".join([s.name for s in services]),
        pickup_date=data.get("pickupDate", ""),
        special_instructions=data.get("specialInstructions", ""),
        total=total_calculated,
        status="At Store"  # Set default status
    )
    db.session.add(order)
    db.session.commit()
    generate_qr(order)

    # 3️⃣ Return both order + customer
    return jsonify({
        "order": order.to_dict(),
        "customer": customer.to_dict()
    }), 201

@app.route("/api/orders", methods=["GET"])
def get_orders_by_email():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email query param is required"}), 400

    orders = Order.query.filter_by(customer_email=email).all()
    return jsonify([o.to_dict() for o in orders]), 200

@app.route("/api/orders/<order_id>", methods=["PUT"])
@jwt_required()
def update_order(order_id):
    customer = Customer.query.get_or_404(get_jwt_identity())
    order = Order.query.get_or_404(order_id)
    if order.customer_name != customer.name or order.customer_phone != customer.phone:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json or {}
    if "pickupDate" in data:
        order.pickup_date = data["pickupDate"]
    if "specialInstructions" in data:
        order.special_instructions = data["specialInstructions"]
    if "total" in data:
        order.total = float(data["total"])
    if "serviceId" in data:
        service = Service.query.get(data["serviceId"])
        if not service:
            return jsonify({"error": "Invalid service"}), 400
        order.service_id = service.id
        order.service_name = service.name
        service.usage_count += 1
    db.session.commit()
    return jsonify(order.to_dict())

@app.route("/api/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email query param is required"}), 400

    order = Order.query.get_or_404(order_id)
    if order.customer_email != email:
        return jsonify({"error": "Unauthorized (email mismatch)"}), 401

    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


#-------------- PUBLIC ROUTES ---------------- #
@app.route("/api/services", methods=["GET"])
def get_services():
    services = Service.query.all()
    return jsonify([s.to_dict() for s in services]), 200

# ---------------- EMPLOYEE AUTH ---------------- #
@app.route("/employee/login", methods=["POST"])
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

@app.route("/employee/change-password", methods=["POST"])
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


# ---------------- ADMIN AUTH ---------------- #
ADMIN_USER = "fabclean"
ADMIN_PASS = "fabzclean"

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            if data.get("username") == ADMIN_USER and data.get("password") == ADMIN_PASS:
                session["admin_logged_in"] = True
                return jsonify({"message": "Admin login successful"}), 200
            return jsonify({"error": "Invalid credentials"}), 401
        else:
            username = request.form.get("username")
            password = request.form.get("password")
            if username == ADMIN_USER and password == ADMIN_PASS:
                session["admin_logged_in"] = True
                return redirect(url_for("serve_admin"))
            return render_template("lokesh.html", error="Invalid credentials")
    return render_template("lokesh.html")

@app.route("/admin/logout", methods=["POST"])
@admin_login_required
def admin_logout():
    session.pop("admin_logged_in", None)
    return jsonify({"message": "Admin logged out"}), 200

# ---------------- ADMIN WORKER MANAGEMENT ---------------- #
@app.route("/admin/api/workers", methods=["GET"])
@admin_login_required
def get_workers():
    workers = Worker.query.all()
    return jsonify([w.to_dict() for w in workers]), 200

@app.route("/admin/api/workers", methods=["POST"])
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

@app.route("/admin/api/workers/<int:worker_id>", methods=["PUT"])
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

@app.route("/admin/api/workers/<int:worker_id>", methods=["DELETE"])
@admin_login_required
def delete_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    db.session.delete(worker)
    db.session.commit()
    return jsonify({"message": "Worker deleted"}), 200


# ---------------- ADMIN TRANSIT MANAGEMENT ---------------- #
@app.route("/admin/api/transit-batches", methods=["GET"])
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

@app.route("/admin/api/transit-batches", methods=["POST"])
@admin_login_required
def create_transit_batch():
    data = request.json or {}
    order_ids = data.get("order_ids")
    transit_type = data.get("type")
    created_by = data.get("created_by")

    if not all([order_ids, transit_type, created_by]):
        return jsonify({"error": "Missing required fields"}), 400

    if transit_type == "FACTORY_TO_STORE":
        # Check for existing non-completed transits for the same orders
        existing_transits = TransitOrder.query.join(TransitBatch).filter(
            TransitOrder.order_id.in_(order_ids),
            TransitBatch.type == "FACTORY_TO_STORE",
            TransitBatch.status != "COMPLETED"
        ).first()

        if existing_transits:
            return jsonify({"error": "A factory to store transit for one or more of these orders is already in progress."}), 400

    # Create the batch
    id_prefix = "S2F" if transit_type == "STORE_TO_FACTORY" else "F2S"
    batch_transit_id = f"{id_prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_batch = TransitBatch(
        transit_id=batch_transit_id,
        type=transit_type,
        created_by=created_by
    )
    db.session.add(new_batch)
    db.session.commit()

    # Link orders and update status
    for order_id in order_ids:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": f"Order {order_id} not found"}), 404
        
        # This endpoint is now only for creating the batch, status change happens on initiate
        transit_order = TransitOrder(transit_batch_id=new_batch.id, order_id=order.id)
        db.session.add(transit_order)

    db.session.commit()
    return jsonify(new_batch.to_dict()), 201

@app.route("/admin/api/transit-batches/<int:batch_id>", methods=["GET"])
@admin_login_required
def get_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    batch_dict = batch.to_dict()
    batch_dict['orders'] = [o.to_dict() for o in orders]
    
    return jsonify(batch_dict), 200

@app.route("/admin/api/transit-batches/<int:batch_id>/initiate", methods=["PUT"])
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

@app.route("/admin/api/transit-batches/<int:batch_id>/receive", methods=["PUT"])
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

@app.route("/admin/api/transit-batches/<int:batch_id>/complete", methods=["PUT"])
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
    else:  # FACTORY_TO_STORE
        for order in orders:
            order.status = "Ready for Delivery"

    batch.status = "COMPLETED"
    batch.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(batch.to_dict()), 200



# ---------------- EMPLOYEE TRANSIT MANAGEMENT ---------------- #
@app.route("/employee/api/transit-batches", methods=["GET"])
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


# ✅ New route: fetch available orders for employee
@app.route("/employee/api/orders", methods=["GET"])
def get_employee_orders():
    """
    Returns orders visible to employee UI.
    - If ?status= provided, filter by that.
    - If ?all=1 provided, return all orders (debug).
    - Default: only 'At Store' orders.
    """
    status_q = request.args.get("status")
    all_flag = request.args.get("all")

    if all_flag == "1":
        orders = Order.query.order_by(Order.created_at.desc()).all()
    elif status_q:
        orders = Order.query.filter_by(status=status_q).order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(status="At Store").order_by(Order.created_at.desc()).all()

    return jsonify([o.to_dict() for o in orders]), 200

@app.route("/employee/api/transit-batches", methods=["POST"])
def create_employee_transit_batch():
    data = request.json or {}
    order_ids = data.get("order_ids")
    transit_type = data.get("type")
    created_by = data.get("created_by")

    if not all([order_ids, transit_type, created_by]):
        return jsonify({"error": "Missing required fields"}), 400

    if transit_type == "FACTORY_TO_STORE":
        # Check for existing non-completed transits for the same orders
        existing_transits = TransitOrder.query.join(TransitBatch).filter(
            TransitOrder.order_id.in_(order_ids),
            TransitBatch.type == "FACTORY_TO_STORE",
            TransitBatch.status != "COMPLETED"
        ).first()

        if existing_transits:
            return jsonify({"error": "A factory to store transit for one or more of these orders is already in progress."}), 400

    # Create the batch
    id_prefix = "S2F" if transit_type == "STORE_TO_FACTORY" else "F2S"
    batch_transit_id = f"{id_prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    new_batch = TransitBatch(
        transit_id=batch_transit_id,
        type=transit_type,
        created_by=created_by
    )
    db.session.add(new_batch)
    db.session.commit()

    # Link orders and update status
    for order_id in order_ids:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": f"Order {order_id} not found"}), 404
        
        # This endpoint is now only for creating the batch, status change happens on initiate
        transit_order = TransitOrder(transit_batch_id=new_batch.id, order_id=order.id)
        db.session.add(transit_order)

    db.session.commit()
    return jsonify(new_batch.to_dict()), 201

@app.route("/employee/api/transit-batches/<int:batch_id>", methods=["GET"])
def get_employee_transit_batch(batch_id):
    batch = TransitBatch.query.get_or_404(batch_id)
    transit_orders = TransitOrder.query.filter_by(transit_batch_id=batch.id).all()
    order_ids = [to.order_id for to in transit_orders]
    orders = Order.query.filter(Order.id.in_(order_ids)).all()

    batch_dict = batch.to_dict()
    batch_dict['orders'] = [o.to_dict() for o in orders]
    
    return jsonify(batch_dict), 200

@app.route("/employee/api/transit-batches/<int:batch_id>/initiate", methods=["PUT"])
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

@app.route("/employee/api/transit-batches/<int:batch_id>/receive", methods=["PUT"])
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

@app.route("/employee/api/transit-batches/<int:batch_id>/complete", methods=["PUT"])
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
    else:  # FACTORY_TO_STORE
        for order in orders:
            order.status = "Ready for Delivery"

    batch.status = "COMPLETED"
    batch.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(batch.to_dict()), 200


# ---------------- ADMIN CRUD ---------------- #
@app.route("/admin/api/services", methods=["GET"])
@admin_login_required
def admin_get_services():
    return jsonify([s.to_dict() for s in Service.query.all()])

@app.route("/admin/api/services", methods=["POST"])
@admin_login_required
def create_service():
    data = request.json or {}
    if not data.get("name") or data.get("price") is None:
        return jsonify({"error": "Missing fields"}), 400
    service = Service(name=data["name"], price=float(data["price"]), duration=data.get("duration"))
    db.session.add(service)
    db.session.commit()
    return jsonify(service.to_dict()), 201

@app.route("/admin/api/services/<service_id>", methods=["PUT"])
@admin_login_required
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    data = request.json or {}
    service.name = data.get("name", service.name)
    if "price" in data:
        service.price = float(data["price"])
    service.duration = data.get("duration", service.duration)
    service.status = data.get("status", service.status)
    db.session.commit()
    return jsonify(service.to_dict()), 200

@app.route("/admin/api/services/<service_id>", methods=["DELETE"])
@admin_login_required
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@app.route("/admin/api/customers", methods=["GET"])
@admin_login_required
def get_customers():
    return jsonify([c.to_dict() for c in Customer.query.all()])

@app.route("/api/customers/public", methods=["GET"])
def get_customers_public():
    return jsonify([c.to_dict() for c in Customer.query.all()])



@app.route("/admin/api/customers", methods=["POST"])
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

@app.route("/admin/api/customers/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.json or {}
    customer.name = data.get("name", customer.name)
    customer.email = data.get("email", customer.email)
    customer.phone = data.get("phone", customer.phone)
    db.session.commit()
    return jsonify(customer.to_dict()), 200

@app.route("/admin/api/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted"}), 200


@app.route("/admin/api/orders", methods=["GET"])
def get_orders():
    return jsonify([o.to_dict() for o in Order.query.all()])

@app.route("/admin/api/orders/<string:order_id>", methods=["PUT"])
def update_order_admin(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.json or {}

    if "customerName" in data:
        order.customer_name = data["customerName"]
    if "customerEmail" in data:
        order.customer_email = data["customerEmail"]
    if "serviceId" in data:
        service_ids = [s.strip() for s in data["serviceId"].split(",")]
        services = Service.query.filter(Service.id.in_(service_ids)).all()
        if not services or len(services) != len(service_ids):
            return jsonify({"error": "One or more services are invalid"}), 400

        order.service_id = ",".join([s.id for s in services])
        order.service_name = ",".join([s.name for s in services])
        order.total = sum(s.price for s in services)

        for service in services:
            service.usage_count += 1

    db.session.commit()
    return jsonify(order.to_dict()), 200


@app.route("/admin/api/orders/<string:order_id>", methods=["DELETE"])
def delete_order_admin(order_id):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted"}), 200


# flask route to receive a ping message and respond with pong

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200

# ---------------- ADMIN REACT ROUTING ---------------- #
@app.route("/admin", defaults={"path": ""})
@app.route("/admin/<path:path>")
def serve_admin(path):
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")



# ---------------- INIT DB COMMAND ---------------- #
def ensure_db():
    """Internal function to create and seed the database."""
    db.create_all()

    # seed services if none exist
    if not Service.query.first():
        db.session.add_all([
            Service(id="s1", name="Laundry", price=200, duration="24h"),
            Service(id="s2", name="Dry Cleaning", price=300, duration="48h"),
            Service(id="s3", name="Ironing", price=100, duration="12h"),
        ])
        db.session.commit()

    # seed a default worker if none exist
    if not Worker.query.first():
        default_worker = Worker(name="Employee", email="emp@emp.com")
        default_worker.set_password("emp")
        db.session.add(default_worker)
        db.session.commit()
    
    print("Database initialized and seeded.")

@app.cli.command("init-db")
def init_db_command():
    """Creates the database tables and seeds them with initial data."""
    ensure_db()
  

# ---------------- RUN ---------------- #
if __name__ == "__main__":
    with app.app_context():
        ensure_db()
    app.run(host='0.0.0.0' , port=5001)


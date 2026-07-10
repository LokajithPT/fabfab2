from extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid


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
    worker_id = db.Column(db.Integer, nullable=False)
    order_email = db.Column(db.String(120), nullable=False)
    order_status = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100))
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
    category = db.Column(db.String(100))
    status = db.Column(db.String(50), default="Active")
    usage_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "duration": self.duration,
            "category": self.category,
            "status": self.status,
            "usage_count": self.usage_count,
        }


class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(256), nullable=False)
    address = db.Column(db.Text)
    notes = db.Column(db.Text)
    status = db.Column(db.String(50), default="active")
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
            "address": self.address,
            "notes": self.notes,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
            "totalOrders": getattr(self, 'total_orders', 0),
            "totalSpent": getattr(self, 'total_spent', 0.0),
        }


class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.String(20), primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    customer_address = db.Column(db.Text)
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
            "customerAddress": self.customer_address,
            "serviceId": self.service_id.split(",") if self.service_id else [],
            "service": self.service_name.split(",") if self.service_name else [],
            "pickupDate": self.pickup_date,
            "specialInstructions": self.special_instructions,
            "total": self.total,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
        }


class Delivery(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.String(50), nullable=False)
    driver_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    estimated_delivery = db.Column(db.DateTime, nullable=True)
    actual_delivery = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "vehicleId": self.vehicle_id,
            "driverName": self.driver_name,
            "status": self.status,
            "estimatedDelivery": self.estimated_delivery.isoformat() if self.estimated_delivery else None,
            "actualDelivery": self.actual_delivery.isoformat() if self.actual_delivery else None,
        }


class TransitBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transit_id = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)
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


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    customer_address = db.Column(db.Text)
    service_ids = db.Column(db.String(200))
    preferred_date = db.Column(db.String(50))
    preferred_time = db.Column(db.String(50))
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    converted_order_id = db.Column(db.String(20), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "customerName": self.customer_name,
            "customerEmail": self.customer_email,
            "customerPhone": self.customer_phone,
            "customerAddress": self.customer_address,
            "serviceIds": self.service_ids.split(",") if self.service_ids else [],
            "preferredDate": self.preferred_date,
            "preferredTime": self.preferred_time,
            "notes": self.notes,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
            "convertedOrderId": self.converted_order_id,
        }

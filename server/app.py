import os
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from extensions import db, jwt

from routes.auth import auth_bp
from routes.orders import orders_bp
from routes.workers import workers_bp
from routes.customers import customers_bp
from routes.services import services_bp
from routes.transit import transit_bp
from routes.bookings import bookings_bp
from routes.public_routes import public_bp
from routes.analytics import analytics_bp
from routes.reports import reports_bp
from routes.settings import settings_bp
from routes.whatsapp import whatsapp_bp
from routes.misc import misc_bp


def create_app():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    template_folder = os.path.join(base_dir, "templates")
    dist_folder = os.path.join(base_dir, "reactshit")

    app = Flask(
        __name__,
        static_folder=dist_folder,
        static_url_path="",
        template_folder=template_folder if os.path.exists(template_folder) else None,
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///fabclean.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "super-secret-key-loki"
    app.config["JWT_SECRET_KEY"] = "super-jwt-secret-loki"
    app.config["SESSION_COOKIE_SECURE"] = False
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(workers_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(services_bp)
    app.register_blueprint(transit_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(whatsapp_bp)
    app.register_blueprint(misc_bp)

    with app.app_context():
        ensure_db(app)

    return app


def ensure_db(app):
    from models import Worker, Order, Customer, Service, TransitBatch, TransitOrder, Booking, Delivery, Track
    db.create_all()

    if not Worker.query.first():
        default_worker = Worker(name="Employee", email="emp@emp.com")
        default_worker.set_password("emp")
        db.session.add(default_worker)
        db.session.commit()

    print("Database initialized and seeded.")


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)

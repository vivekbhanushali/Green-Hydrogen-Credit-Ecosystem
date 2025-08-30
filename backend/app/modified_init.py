from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    # Configure the Flask application
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///carbon_credit.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'super-secret'  # Change to use env var in production
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        # Import routes after initializing db to avoid circular imports
        from .routes.auth_routes import auth_bp
        from .routes.NGO_routes import ngo_bp
        from .routes.buyer_routes import buyer_bp
        from .routes.auditor_routes import auditor_bp
        from .routes.health_routes import health_bp
        
        # Register blueprints
        app.register_blueprint(auth_bp)
        app.register_blueprint(ngo_bp)
        app.register_blueprint(buyer_bp)
        app.register_blueprint(auditor_bp)
        app.register_blueprint(health_bp)
        
        # Create database tables if they don't exist
        db.create_all()
        
    return app

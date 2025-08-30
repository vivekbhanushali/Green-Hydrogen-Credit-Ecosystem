from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager,create_access_token, jwt_required,get_jwt_identity
from flask_cors import CORS
from config import Config
from .utilis.redis import init_redis

db = SQLAlchemy(engine_options=Config.SQLALCHEMY_ENGINE_OPTIONS)
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config.from_object(Config)
    # a central invalidation logic is required
    # init_redis(app)
    CORS(app)
    db.init_app(app)
    migrate.init_app(app,db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.NGO_routes import NGO_bp
    from .routes.buyer_routes import buyer_bp
    from .routes.auditor_routes import auditor_bp
    from .routes.health_routes import health_bp
    from .routes.verification_routes import verification_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(NGO_bp)
    app.register_blueprint(buyer_bp)
    app.register_blueprint(auditor_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(verification_bp)
    
    with app.app_context():
        db.create_all()
        print("Connected to NeonPostgresql !")

    # print(app.url_map)

    return app

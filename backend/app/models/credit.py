from app import db
from app.models.user import User
# from app.models.association import AuditorAssociation

class Credit(db.Model):
    __tablename__ = 'credits'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    is_expired = db.Column(db.Boolean, default=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    docu_url = db.Column(db.String(200))
    auditors = db.Column(db.String(500))  # Store as JSON string for SQLite compatibility
    req_status = db.Column(db.Integer, nullable=False)
    creator = db.relationship('User', backref='credits')

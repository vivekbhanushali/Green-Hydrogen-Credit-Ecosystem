from app import db

class Request(db.Model):
    __tablename__ = 'requests'
    id = db.Column(db.Integer, primary_key=True)
    credit_id = db.Column(db.Integer, db.ForeignKey('credits.id'), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    auditors = db.Column(db.String(500))  # Store as JSON string for SQLite compatibility
    score = db.Column(db.Integer, default=0)

    credit = db.relationship('Credit', backref='requests')
    creator = db.relationship('User', backref='requests')

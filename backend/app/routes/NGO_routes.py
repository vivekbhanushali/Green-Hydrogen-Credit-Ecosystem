from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models.credit import Credit
from app.models.request import Request
from app.models.transaction import PurchasedCredit, Transactions
from app.models.user import User
from app.utilis.redis import get_redis
import random
import json

NGO_bp = Blueprint('NGO', __name__)
redis_client = get_redis()
def get_current_user():
    try:
        return json.loads(get_jwt_identity())
    except json.JSONDecodeError:
        return None

def numberOfAuditors(k) -> int:
    return int((k//500)*2 + 3)

@NGO_bp.route('/api/NGO/credits', methods=['GET', 'POST'])
@jwt_required()
def manage_credits():
    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.filter_by(username=current_user.get('username')).first()

    key = user.username
    # Ensure only credits created by this NGO are visible
    if request.method == 'GET':
        if redis_client:
            try:
                cached_credits = redis_client.get(key)
                if cached_credits:
                    print("cache hit credit")
                    print(f"key: {key}")
                    return jsonify(json.loads(cached_credits))
                else:
                    print("cache miss credit")
                    print(f"key: {key}")
            except Exception as e:
                print(f"redis get client error: {e}")
        credits = Credit.query.filter_by(creator_id=user.id).order_by(Credit.id.asc()).all()
        data = []
        for c in credits:
            req = Request.query.filter_by(credit_id=c.id).first()
            data.append({
                "id": c.id,
                "name": c.name,
                "amount": c.amount,
                "price": c.price,
                "is_active": c.is_active,
                "is_expired": c.is_expired,
                "creator_id": c.creator_id,
                "secure_url": c.docu_url,
                "req_status": c.req_status,
                "auditors_count": len(c.auditors),
                "auditor_left": len(req.auditors) if req and req.auditors else 0,
                "score": req.score if req else 0
            })
        if redis_client:
            try:
                redis_client.set(key, json.dumps(data))
            except Exception as e:
                print(f"Redis error: {e}")
        return jsonify(data), 200

    # Allow the NGO to create new credits
    if request.method == 'POST':
        
        if redis_client:
            try:
                # cached_credits = redis_client.get(key)
                redis_client.delete(key)
                print("cache credit delete")
                print(f"key: {key}")
            except:
                pass
        #do something regarding the amount 
        data = request.json

        auditors = User.query.filter_by(role = 'auditor').all()
        auditor_ids = [auditor.id for auditor in auditors]
        k = numberOfAuditors(int(data['amount']))
        try:
            selected_auditor_ids = random.sample(auditor_ids, k)
        except ValueError:
            return jsonify({"message": "Not enough auditors"}), 503
        
        new_credit = Credit(
            id=data['creditId'],
            name=data['name'], 
            amount=data['amount'], 
            price=data['price'], 
            creator_id=user.id,
            docu_url = data['secure_url'],
            auditors = selected_auditor_ids,
            req_status = 1
        )
        db.session.add(new_credit)

        new_request = Request(
            credit_id=data['creditId'],
            creator_id=user.id,
            auditors=selected_auditor_ids
        )
        db.session.add(new_request)

        
        db.session.commit()
        return jsonify({"message": "Credit created successfully"}), 201


@NGO_bp.route('/api/NGO/credits/expire/<int:credit_id>', methods=['PATCH'])
@jwt_required()
def expire_credit(credit_id):
    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.filter_by(username=current_user.get('username')).first()
    credit = Credit.query.get(credit_id)
    pc = PurchasedCredit.query.filter_by(credit_id=credit.id).first()

    if not credit:
        return jsonify({"message": "Credit not found"}), 404
    if not pc:
        return jsonify({"message": f"Credit can't be expired as it has not been sold yet, credit with B_ID {credit_id} is not found"}), 400
    # Ensure only the creator NGO can expire the credit
    if credit.creator_id != user.id:
        return jsonify({"message": "You do not have permission to expire this credit"}), 403

    # Expire the credit
    credit.is_active = False
    credit.is_expired = True
    pc.is_expired = True
    db.session.commit()
    return jsonify({"message": "Credit expired successfully"}), 200

@NGO_bp.route('/api/NGO/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403
    key = current_user.get('username')+"trans"
    if redis_client:
        try:
            cached_txns = redis_client.get(key)
            if cached_txns:
                print("Cache hit")
                return jsonify(json.loads(cached_txns)), 200
            else:
                print("Cache miss")
        except Exception as e:
            print(f"redis get client error: {e}")
    transactions = Transactions.query.order_by(Transactions.timestamp.desc()).all()
    transaction_list = []
    for t in transactions:
        transaction_list.append({
            "id": t.id,
            "buyer": t.buyer_id,
            "credit": t.credit_id,
            "amount": t.amount,
            "total_price": t.total_price,
            "timestamp": t.timestamp.isoformat(),
            "txn_hash": t.txn_hash
        })
        if redis_client:
            try:
                redis_client.set(key,json.dumps(transaction_list),px=500)
            except Exception as e:
                print(f"Redis error: {e}")
    return jsonify(transaction_list)


@NGO_bp.route('/api/NGO/expire-req', methods=['POST'])
@jwt_required()
def check_expire_request():
    data = request.json

    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    username = current_user.get('username')
    # Fetch user details from the database
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    #check if the given password was true 
    if bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"message": "User verified succesfully! can proceed to expire credit"}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@NGO_bp.route('/api/NGO/audit-req', methods=['GET'])
@jwt_required()
def check_audit_request():
    auditors = User.query.filter_by(role = 'auditor').all()
    num_auditors = len(auditors)
    # print("auditors avail:",num_auditors)

    hydrogen_amount = request.args.get('amount')
    if not hydrogen_amount:
        return jsonify({"message": "Missing 'amount' parameter"}), 400

    try:
        hydrogen_amount = int(hydrogen_amount)
    except ValueError:
        return jsonify({"message": "'amount' must be an integer"}), 400
    
    req_auditors = numberOfAuditors(int(hydrogen_amount))

    if num_auditors < req_auditors:
        return jsonify({"message": f"Not Enough Auditors for {hydrogen_amount} kg of hydrogen. Maybe split the credit !"}), 503
    
    return jsonify({"message": f"Enough auditors for the credit"}), 200

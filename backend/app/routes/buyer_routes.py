from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.credit import Credit
from app.models.transaction import PurchasedCredit
from app.models.transaction import Transactions
from app.utilis.redis import get_redis
# Use simple certificate only - no WeasyPrint
from app.utilis.simple_certificate import generate_simple_certificate as generate_certificate_data
import json
import io
import base64
# WeasyPrint is not available
WEASYPRINT_AVAILABLE = False
from app import db

buyer_bp = Blueprint('buyer_bp', __name__)
redis_client = get_redis()
def get_current_user():
    try:
        return json.loads(get_jwt_identity())
    except json.JSONDecodeError:
        return None

@buyer_bp.route('/api/buyer/credits', methods=['GET'])
@jwt_required()
def buyer_credits():
    key = "buyer_credits"
    if redis_client:
        try:
            cached_credits = redis_client.get(key)
            if cached_credits:
                print("cache hit buyer_credits")
                return jsonify(json.loads(cached_credits))
            else:
                print("cache miss buyer_credits")
        except Exception as e:
            print(f"redis get client error: {e}")
    credits = Credit.query.filter_by(is_active =True).all()
    data = [{"id": c.id, "name": c.name, "amount": c.amount, "price": c.price,"creator":c.creator_id, "secure_url": c.docu_url} for c in credits]
    if redis_client:
        try:
            redis_client.set(key, json.dumps(data))
            print("buyer_credits cached")
        except:
            pass
    return jsonify(data)

@buyer_bp.route('/api/buyer/purchase', methods=['POST'])
@jwt_required()
def purchase_credit():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401

    data = request.json
    if not data or 'credit_id' not in data:
        return jsonify({"message": "Missing credit_id"}), 400
    # print(data) 
    if 'txn_hash' not in data:
        return jsonify({"message": "Missing txn_hash"}), 400

    # Retrieve the credit
    credit = Credit.query.get(data['credit_id'])
    if not credit:
        return jsonify({"message": "Credit not found"}), 404

    # Check if the current user exists
    user = User.query.filter_by(username=current_user['username']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check if the credit already exists in the purchased_credits table
    existing_credit = PurchasedCredit.query.filter_by(credit_id=credit.id).first()
    if existing_credit:
        db.session.delete(existing_credit)

    # Add new entry to purchased_credits
    purchased_credit = PurchasedCredit(
        user_id=user.id,
        credit_id=credit.id,
        amount=credit.amount,
        creator_id=credit.creator_id,
    )

    # Record the transaction
    transaction = Transactions(
        buyer_id=user.id,
        credit_id=credit.id,
        amount=credit.amount,
        total_price=credit.price,
        txn_hash=data['txn_hash']
    )
    key = "buyer_credits"
    if redis_client:
        try:
            redis_client.delete(key)
        except Exception as e:
            print(f"redis get client error: {e}")
    # Update the credit to inactive
    credit.is_active = False

    # Add and commit the changes
    db.session.add(purchased_credit)
    db.session.add(transaction)
    db.session.commit()

    return jsonify({"message": "Credit purchased successfully"}), 200


@buyer_bp.route('/api/buyer/sell', methods=['PATCH'])
@jwt_required()
def sell_credit():
    # get creditId from request and in credits DB set is_active == true for object that same id

    current_user  = get_current_user()
    if not current_user:
        return jsonify({"message" : "Invalid token"}),401

    # Parse request data
    data = request.json
    if not data or 'credit_id' not in data or 'salePrice' not in data:
        return jsonify({"message": "Missing credit_id or salePrice"}), 400

    credit = Credit.query.get(data['credit_id'])
    if credit:
        credit.is_active = True
        credit.price = data['salePrice']

        if(credit.req_status != 3):
            credit.req_status = 3
            
        db.session.commit()

        return jsonify({"message": f"Credit put to sale with price {data['salePrice']}" }), 200
    return jsonify({"message": "Can't sell at this point"}), 400

@buyer_bp.route('/api/buyer/remove-from-sale', methods=['PATCH'])
@jwt_required()
def remove_credit():
    # get creditId from request and in credits DB set is_active == false for object with same id
    current_user  = get_current_user()
    if not current_user:
        return jsonify({"message" : "Invalid token"}),401

    # Parse request data
    data = request.json
    if not data or 'credit_id' not in data:
        return jsonify({"message": "Missing credit_id"}), 404

    credit = Credit.query.get(data['credit_id'])
    if credit:
        credit.is_active = False
        db.session.commit()

        return jsonify({"message": "Credit removed from sale" }), 200
    return jsonify({"message": "For some reason cant remove from sale, man if error is coming here we are cooked"}), 400

@buyer_bp.route('/api/buyer/purchased', methods=['GET'])
@jwt_required()
def get_purchased_credits():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401

    user = User.query.filter_by(username=current_user['username']).first()
    key = user.username
    if redis_client:
        try:
            cached_purchased = redis_client.get(key)
            if cached_purchased:
                return jsonify(json.loads(cached_purchased)), 200
        except Exception as e:
            print(f"redis get client error: {e}")

    purchased_credits = PurchasedCredit.query.filter_by(user_id=user.id).all()
    credits = []
    for pc in purchased_credits:
        credit = Credit.query.get(pc.credit_id)
        creator = User.query.get(pc.creator_id) if pc.creator_id else None
        credits.append({
            "id": credit.id,
            "name": credit.name,
            "amount": pc.amount,
            "price": credit.price,
            "is_active": credit.is_active,
            "is_expired": credit.is_expired,
            "creator": {
                "id": creator.id,
                "username": creator.username,
                "email": creator.email
            } if creator else None
        })
        if redis_client:
            try:
                redis_client.set(key,json.dumps(credits),px=500)
                print("puchased cached")
            except:
                pass
    return jsonify(credits), 200

@buyer_bp.route('/api/buyer/generate-certificate/<int:creditId>', methods=['GET'])
@jwt_required()
def generate_certificate(creditId):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401
    
    user = User.query.filter_by(username=current_user['username']).first()
    purchased_credit = PurchasedCredit.query.filter_by(credit_id=creditId, user_id=user.id).first()
    if not purchased_credit:
        return jsonify({"message": f"Credit with {creditId} was never purchased"}), 404

    credit = Credit.query.get(purchased_credit.credit_id)
    if credit is None:
        return jsonify({"message":"No such credit found"}),404

    transaction = Transactions.query.filter_by(credit_id=purchased_credit.credit_id).order_by(Transactions.timestamp.desc()).first()
    if transaction is None:
        return jsonify({"message": f"Respective transaction with {purchased_credit.credit_id} not found"}), 404
    
    # Use the certificate generator
    certificate_data = generate_certificate_data(purchased_credit.id, user, purchased_credit, credit, transaction) if credit.is_expired else None
        
    if certificate_data is None:
        return jsonify({"message":f"No credit with {credit.id} has expired"}), 404
    
    return jsonify(certificate_data), 200
@buyer_bp.route('/api/buyer/download-certificate/<int:creditId>',methods=['GET'])
@jwt_required()
def download_certificate(creditId):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401
    
    user = User.query.filter_by(username=current_user['username']).first()
    purchased_credit = PurchasedCredit.query.filter_by(credit_id=creditId, user_id=user.id).first()
    if not purchased_credit:
        return jsonify({"message": f"Credit with {creditId} was never purchased"}), 404

    credit = Credit.query.get(purchased_credit.credit_id)
    if credit is None:
        return jsonify({"message":"No such credit found"}),404
    transaction = Transactions.query.filter_by(credit_id=purchased_credit.credit_id).order_by(Transactions.timestamp.desc()).first()
    if transaction is None:
        return jsonify({"message": "Respective transaction not found"}), 404
    
    certificate_data = generate_certificate_data(purchased_credit.id, user, purchased_credit, credit, transaction) if credit.is_expired else None
    if certificate_data is None:
        return jsonify({"message":f"No credit with {credit.id} has expired"}), 404
    
    # Return HTML certificate only since WeasyPrint is not available
    return jsonify({
        "filename": f"Hydrogen_Credit_Certificate_{purchased_credit.id}.html",
        "html": certificate_data['certificate_html'],
        "certificate_id": certificate_data['certificate_id'],
        "buyer_name": certificate_data['buyer_name'],
        "credit_name": certificate_data['credit_name'],
        "amount": certificate_data['amount'],
        "purchase_date": certificate_data['purchase_date'],
        "transaction_hash": certificate_data['transaction_hash'],
        "message": "PDF generation requires GTK libraries. Using HTML certificate instead."
    })

@buyer_bp.route('/api/buyer/credits/<int:credit_id>', methods=['GET'])
@jwt_required()
def get_credit_details(credit_id):
    try:
        credit = Credit.query.get_or_404(credit_id)
        user = User.query.get_or_404(credit.creator_id)
        # Fetch usernames for auditors
        auditors = credit.auditors or []
        auditor_users = User.query.filter(User.id.in_(auditors)).all()
        auditor_usernames = {user.id: user.username for user in auditor_users}
        # Map auditor IDs to usernames, preserving order
        auditor_list = [
            {"id": auditor_id, "username": auditor_usernames.get(auditor_id, "Unknown")}
            for auditor_id in auditors
        ]

        return jsonify({
            "id": credit.id,
            "name": credit.name,
            "amount": credit.amount,
            "price": credit.price,
            "is_active": credit.is_active,
            "is_expired": credit.is_expired,
            "creator_id": credit.creator_id,
            "creator_name": user.username,
            "docu_url": credit.docu_url,
            "auditors": auditor_list,  # Return list of {id, username}
            "req_status": credit.req_status
        })
    except Exception as e:
        return jsonify({"error": "Credit not found"}), 404

# 🚀 NEW ENHANCED API ENDPOINTS
@buyer_bp.route('/api/buyer/portfolio-analytics', methods=['GET'])
@jwt_required()
def get_portfolio_analytics():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401

    user = User.query.filter_by(username=current_user['username']).first()
    purchased_credits = PurchasedCredit.query.filter_by(user_id=user.id).all()
    
    total_invested = 0
    current_value = 0
            hydrogen_offset = 0
    credits_count = len(purchased_credits)
    
    for pc in purchased_credits:
        credit = Credit.query.get(pc.credit_id)
        if credit:
            total_invested += float(credit.price)
            # Mock performance calculation
            performance = (hash(str(credit.id)) % 100) - 50  # Random performance between -50 and 50
            current_value += float(credit.price) * (1 + performance / 100)
            hydrogen_offset += float(credit.amount) * 0.5  # Mock H₂ production impact
    
    profit_loss = current_value - total_invested
    profit_loss_percentage = (profit_loss / total_invested * 100) if total_invested > 0 else 0
    
    return jsonify({
        "totalInvested": round(total_invested, 2),
        "currentValue": round(current_value, 2),
        "profitLoss": round(profit_loss, 2),
        "profitLossPercentage": round(profit_loss_percentage, 2),
                    "hydrogenOffset": round(hydrogen_offset, 1),
        "creditsCount": credits_count
    })

@buyer_bp.route('/api/buyer/market-trends', methods=['GET'])
@jwt_required()
def get_market_trends():
    # Mock market trends data for Green Hydrogen
    trends = [
        {"name": "Electrolysis H₂", "trend": "up", "percentage": 18.5, "volume": "3.2M"},
        {"name": "Solar H₂", "trend": "up", "percentage": 12.3, "volume": "2.1M"},
        {"name": "Wind H₂", "trend": "down", "percentage": -2.1, "volume": "1.8M"},
        {"name": "Biomass H₂", "trend": "up", "percentage": 25.7, "volume": "950K"}
    ]
    return jsonify(trends)

@buyer_bp.route('/api/buyer/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401

    user = User.query.filter_by(username=current_user['username']).first()
    purchased_credits = PurchasedCredit.query.filter_by(user_id=user.id).all()
    purchased_credit_ids = [pc.credit_id for pc in purchased_credits]
    
    # Get available credits that user hasn't purchased
    available_credits = Credit.query.filter(
        Credit.is_active == True,
        ~Credit.id.in_(purchased_credit_ids)
    ).limit(5).all()
    
    recommendations = []
    for credit in available_credits:
        creator = User.query.get(credit.creator_id)
        recommendations.append({
            "id": credit.id,
            "name": credit.name,
            "amount": credit.amount,
            "price": credit.price,
            "creator": {
                "id": creator.id,
                "username": creator.username,
                "email": creator.email
            } if creator else None,
            "score": (hash(str(credit.id)) % 100),  # Mock score
                            "reason": ["High hydrogen impact", "Trending", "Best value", "Popular choice"][hash(str(credit.id)) % 4]
        })
    
    # Sort by score
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(recommendations)

@buyer_bp.route('/api/buyer/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    # Mock notifications for Green Hydrogen
    notifications = [
        {"id": 1, "type": "success", "message": "H₂ portfolio value increased by 15.2%", "time": "2 min ago"},
        {"id": 2, "type": "info", "message": "New green hydrogen credit available in your favorite category", "time": "15 min ago"},
        {"id": 3, "type": "warning", "message": "3 H₂ credits expiring in 30 days", "time": "1 hour ago"},
        {"id": 4, "type": "success", "message": "H₂ certificate generated successfully", "time": "2 hours ago"}
    ]
    return jsonify(notifications)

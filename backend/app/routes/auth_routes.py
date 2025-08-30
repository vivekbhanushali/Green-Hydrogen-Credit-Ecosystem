import requests
from flask import Blueprint, request, jsonify
from app import db, bcrypt, create_access_token
from app.models.user import User
import json
import os
from dotenv import load_dotenv
from datetime import timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity

load_dotenv()

auth_bp = Blueprint('auth', __name__)
SECRET_KEY =os.getenv('SECRET_KEY','1x0000000000000000000000000000000AA')
@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.json

    # Check if user already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"message": "Username already exists"}), 400

    # For development, skip CAPTCHA verification
    captcha_response = data.get('cf-turnstile-response')
    if captcha_response:
        captcha_verify = requests.post('https://challenges.cloudflare.com/turnstile/v0/siteverify',
                                       data={
                                       'secret': SECRET_KEY,
                                       'response': captcha_response,
                                       }).json()
        if not captcha_verify.get('success'):
            return jsonify({"message":"CAPTCHA failed"}),400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], email=data['email'], password=hashed_password, role=data['role'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": f"{data['role']} created successfully"}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        if data['role'] != user.role:
            return jsonify({"message": "Unauthorized"}),403
        identity = json.dumps({"username": user.username, "role": user.role})
        expires = timedelta(hours=12)
        access_token = create_access_token(identity=identity, expires_delta= expires)
        return jsonify(access_token=access_token,role=user.role), 200
    return jsonify({"message": "Invalid credentials"}), 401

@auth_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        identity = get_jwt_identity()
        user_data = json.loads(identity)
        username = user_data.get('username')
        role = user_data.get('role')
        
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        return jsonify({
            "username": user.username,
            "email": user.email,
            "role": user.role
        }), 200
    except Exception as e:
        return jsonify({"message": "Error fetching profile"}), 500


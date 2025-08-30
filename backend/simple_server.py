# Enhanced server with proper authentication
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
from datetime import timedelta
import sqlite3
import uuid

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Configure JWT
app.config['JWT_SECRET_KEY'] = 'super-secure-jwt-key'  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)
jwt = JWTManager(app)

# Setup SQLite database for users
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'carbon_credit.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')
    
    # Create credits table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS credits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        price REAL NOT NULL,
        creator_id TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        is_expired BOOLEAN DEFAULT 0,
        docu_url TEXT,
        FOREIGN KEY (creator_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized")

# Initialize database
init_db()

# Health check endpoints
@app.route('/api/health', methods=['GET'])
@app.route('/api/healthz', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"}), 200

# User registration endpoint
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    if not data or 'username' not in data or 'email' not in data or 'password' not in data or 'role' not in data:
        return jsonify({"message": "Missing required fields"}), 400
    
    # Check if role is valid
    if data['role'] not in ['buyer', 'NGO', 'auditor']:
        return jsonify({"message": "Invalid role"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if username or email already exists
    cursor.execute('SELECT * FROM users WHERE username = ? OR email = ?', (data['username'], data['email']))
    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "Username or email already exists"}), 409
    
    # Hash the password
    hashed_password = generate_password_hash(data['password'])
    user_id = str(uuid.uuid4())
    
    # Insert new user
    cursor.execute(
        'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
        (user_id, data['username'], data['email'], hashed_password, data['role'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({"message": f"{data['role']} created successfully", "user_id": user_id}), 201

# User login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'username' not in data or 'password' not in data or 'role' not in data:
        return jsonify({"message": "Missing required fields"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Find user by username
    cursor.execute('SELECT * FROM users WHERE username = ?', (data['username'],))
    user = cursor.fetchone()
    
    if user and check_password_hash(user['password'], data['password']):
        if data['role'] != user['role']:
            conn.close()
            return jsonify({"message": "Unauthorized - incorrect role"}), 403
        
        # Create JWT token
        identity = json.dumps({"username": user['username'], "role": user['role'], "id": user['id']})
        access_token = create_access_token(identity=identity)
        
        conn.close()
        return jsonify(access_token=access_token, role=user['role']), 200
    
    conn.close()
    return jsonify({"message": "Invalid credentials"}), 401

# Protected route to get user profile
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user = json.loads(get_jwt_identity())
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get user details
    cursor.execute('SELECT id, username, email, role FROM users WHERE username = ?', (current_user['username'],))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    user_data = {
        "id": user['id'],
        "username": user['username'],
        "email": user['email'],
        "role": user['role']
    }
    
    conn.close()
    return jsonify(user_data), 200

# Credits listing endpoint for buyers
@app.route('/api/buyer/credits', methods=['GET'])
@jwt_required(optional=True)
def buyer_credits():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all active credits
    cursor.execute('''
    SELECT c.id, c.name, c.amount, c.price, c.creator_id, c.docu_url, u.username as creator_name
    FROM credits c
    JOIN users u ON c.creator_id = u.id
    WHERE c.is_active = 1 AND c.is_expired = 0
    ''')
    
    credits = []
    for row in cursor.fetchall():
        credits.append({
            "id": row['id'],
            "name": row['name'],
            "amount": row['amount'],
            "price": row['price'],
            "creator": row['creator_id'],
            "creator_name": row['creator_name'],
            "secure_url": row['docu_url'] or "https://example.com/default"
        })
    
    conn.close()
    
    # If no credits in database, return mock data
    if not credits:
        return jsonify([
            {
                "id": str(uuid.uuid4()),
                "name": "Amazon Forest Credit",
                "amount": 10,
                "price": 0.1,
                "creator": "ngo_user_id",
                "creator_name": "Amazon Foundation",
                "secure_url": "https://example.com/credit1"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Solar Energy Credit",
                "amount": 20,
                "price": 0.2,
                "creator": "ngo_user_id",
                "creator_name": "Solar Power NGO",
                "secure_url": "https://example.com/credit2"
            }
        ]), 200
    
    return jsonify(credits), 200

# NGO credit creation endpoint
@app.route('/api/ngo/create-credit', methods=['POST'])
@jwt_required()
def create_credit():
    current_user = json.loads(get_jwt_identity())
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Only NGOs can create credits"}), 403
    
    data = request.json
    if not data or 'name' not in data or 'amount' not in data or 'price' not in data:
        return jsonify({"message": "Missing required fields"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get user id
    cursor.execute('SELECT id FROM users WHERE username = ? AND role = "NGO"', (current_user['username'],))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"message": "User not found or not an NGO"}), 404
    
    credit_id = str(uuid.uuid4())
    
    # Insert new credit
    cursor.execute(
        'INSERT INTO credits (id, name, amount, price, creator_id, docu_url) VALUES (?, ?, ?, ?, ?, ?)',
        (credit_id, data['name'], data['amount'], data['price'], user[0], data.get('docu_url', ''))
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "Credit created successfully",
        "credit_id": credit_id
    }), 201

# Main execution
if __name__ == '__main__':
    print("Starting enhanced backend server with authentication...")
    app.run(host='0.0.0.0', port=5000, debug=True)

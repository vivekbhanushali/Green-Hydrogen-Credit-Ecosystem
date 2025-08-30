"""
Full server implementation for Carbon Credit Platform
Includes all necessary APIs for the frontend application
"""
from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import sqlite3
import uuid
from datetime import datetime, timedelta
import io

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secure-jwt-key')  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Setup SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'carbon_credit_full.db')
UPLOADS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure uploads directory exists
if not os.path.exists(UPLOADS_FOLDER):
    os.makedirs(UPLOADS_FOLDER)

def init_db():
    """Initialize database tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )
    ''')
    
    # Create credits table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS credits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        amount INTEGER NOT NULL,
        price REAL NOT NULL,
        creator_id TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        is_expired BOOLEAN DEFAULT 0,
        is_verified BOOLEAN DEFAULT 0,
        is_on_sale BOOLEAN DEFAULT 0,
        docu_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
    )
    ''')
    
    # Create transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        credit_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        buyer_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        price REAL NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_id) REFERENCES credits (id),
        FOREIGN KEY (seller_id) REFERENCES users (id),
        FOREIGN KEY (buyer_id) REFERENCES users (id)
    )
    ''')
    
    # Create audit requests table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_requests (
        id TEXT PRIMARY KEY,
        credit_id TEXT NOT NULL,
        auditor_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, approved, rejected
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completion_date TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (credit_id) REFERENCES credits (id),
        FOREIGN KEY (auditor_id) REFERENCES users (id)
    )
    ''')

    # Create user_credits table for tracking ownership
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_credits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        credit_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_on_sale BOOLEAN DEFAULT 0,
        sale_price REAL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (credit_id) REFERENCES credits (id)
    )
    ''')

    # Create certificates table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS certificates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        credit_id TEXT NOT NULL,
        transaction_id TEXT,
        certificate_path TEXT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (credit_id) REFERENCES credits (id),
        FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    )
    ''')
    
    # Generate test password hashes
    password = 'sepolia'
    password_hash = generate_password_hash(password)
    print(f"Generated password hash for '{password}': {password_hash}")
    
    # Insert test users if they don't exist
    test_users = [
        {
            'id': str(uuid.uuid4()),
            'username': 'test_buyer',
            'email': 'buyer@example.com',
            'password': password_hash,
            'role': 'buyer'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'test_admin',
            'email': 'ngo@example.com',
            'password': password_hash,
            'role': 'NGO'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'test_auditor',
            'email': 'auditor@example.com',
            'password': password_hash,
            'role': 'auditor'
        }
    ]
    
    # Delete existing test users to avoid login issues
    cursor.execute('DELETE FROM users WHERE username IN (?, ?, ?)', 
                  ('test_buyer', 'test_admin', 'test_auditor'))
    
    # Insert test users
    for user in test_users:
        cursor.execute(
            'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
            (user['id'], user['username'], user['email'], user['password'], user['role'])
        )
        print(f"Added test user: {user['username']} with role {user['role']}")
    
    conn.commit()
    conn.close()
    print("Database initialized with all required tables and test users")

# Initialize database
init_db()

# Helper functions
def get_user_by_username(username):
    """Get user by username"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Get user by ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user

def create_dummy_credit(creator_id, name="Forest Carbon Credit", amount=100, price=0.1):
    """Create a dummy credit for testing"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    credit_id = str(uuid.uuid4())
    description = f"Carbon credits generated from forest conservation project"
    
    cursor.execute(
        '''INSERT INTO credits 
           (id, name, description, amount, price, creator_id, is_active, is_verified) 
           VALUES (?, ?, ?, ?, ?, ?, 1, 1)''',
        (credit_id, name, description, amount, price, creator_id)
    )
    
    conn.commit()
    conn.close()
    return credit_id

# API Routes

# Health check endpoints
@app.route('/api/health', methods=['GET'])
@app.route('/api/healthz', methods=['GET'])
def health_check():
    """Health check endpoint"""
    debug_log("Health check endpoint called")
    return jsonify({"status": "ok", "message": "Backend is running"}), 200

@app.route('/api/test-users', methods=['GET'])
def test_users():
    """List all test users in the database"""
    debug_log("Test users endpoint called")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, username, email, role FROM users')
    users = [dict(user) for user in cursor.fetchall()]
    
    conn.close()
    debug_log(f"Found {len(users)} users")
    
    return jsonify(users), 200

# User API Routes

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register a new user"""
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
    
    # If this is an NGO user, create a test credit for them
    if data['role'] == 'NGO':
        create_dummy_credit(user_id)
    
    conn.close()
    
    return jsonify({"message": f"{data['role']} created successfully", "user_id": user_id}), 201

def debug_log(message):
    """Log debug messages to a file"""
    with open('debug.log', 'a') as f:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        f.write(f"[{timestamp}] {message}\n")

@app.route('/api/login', methods=['POST'])
def login():
    """Login a user"""
    debug_log("Login endpoint called")
    data = request.json
    debug_log(f"Login attempt with data: {data}")
    if not data or 'username' not in data or 'password' not in data or 'role' not in data:
        debug_log("Missing required fields")
        return jsonify({"message": "Missing required fields"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Find user by username
    cursor.execute('SELECT * FROM users WHERE username = ?', (data['username'],))
    user = cursor.fetchone()
    
    if not user:
        debug_log(f"User not found: {data['username']}")
        conn.close()
        return jsonify({"message": "Invalid credentials"}), 401
    
    debug_log(f"Found user: {user['username']} with role {user['role']}")
    
    # Check password
    password_matches = check_password_hash(user['password'], data['password'])
    debug_log(f"Password match: {password_matches}")
    
    if password_matches:
        if data['role'] != user['role']:
            debug_log(f"Role mismatch: expected {user['role']}, got {data['role']}")
            conn.close()
            return jsonify({"message": "Unauthorized - incorrect role"}), 403
        
        # Update last login time
        cursor.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
        conn.commit()
        
        # Create JWT token
        identity = json.dumps({"username": user['username'], "role": user['role'], "id": user['id']})
        access_token = create_access_token(identity=identity)
        
        debug_log(f"Login successful for user: {user['username']}")
        conn.close()
        return jsonify(access_token=access_token, role=user['role']), 200
    
    conn.close()
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
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

# Credit API Routes

@app.route('/api/NGO/credits', methods=['GET'])
@jwt_required()
def ngo_credits():
    """Get credits created by an NGO"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized - Only NGOs can access this endpoint"}), 403
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all credits created by the NGO
    cursor.execute('''
    SELECT * FROM credits WHERE creator_id = (SELECT id FROM users WHERE username = ?)
    ''', (current_user['username'],))
    
    credits = []
    for row in cursor.fetchall():
        credits.append({
            "id": row['id'],
            "name": row['name'],
            "description": row['description'],
            "amount": row['amount'],
            "price": row['price'],
            "is_active": bool(row['is_active']),
            "is_expired": bool(row['is_expired']),
            "is_verified": bool(row['is_verified']),
            "created_at": row['created_at'],
            "secure_url": row['docu_url'] if 'docu_url' in row.keys() else '',
            # Add missing fields that frontend expects
            "req_status": 1,  # Default to pending
            "score": 0,  # Default score
            "auditor_left": 0,  # No auditors assigned yet
            "auditors_count": 0  # No auditors assigned yet
        })
    
    conn.close()
    
    # If no credits found, create a test credit
    if not credits and current_user.get('role') == 'NGO':
        user = get_user_by_username(current_user['username'])
        if user:
            credit_id = create_dummy_credit(user['id'])
            # Fetch the newly created credit
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM credits WHERE id = ?', (credit_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                credits.append({
                    "id": row['id'],
                    "name": row['name'],
                    "description": row['description'],
                    "amount": row['amount'],
                    "price": row['price'],
                    "is_active": bool(row['is_active']),
                    "is_expired": bool(row['is_expired']),
                    "is_verified": bool(row['is_verified']),
                    "created_at": row['created_at'],
                    "secure_url": row['docu_url'] if 'docu_url' in row.keys() else '',
                    # Add missing fields that frontend expects
                    "req_status": 1,  # Default to pending
                    "score": 0,  # Default score
                    "auditor_left": 0,  # No auditors assigned yet
                    "auditors_count": 0  # No auditors assigned yet
                })
    
    return jsonify(credits), 200

@app.route('/api/NGO/credits', methods=['POST'])
@jwt_required()
def create_ngo_credit():
    """Create a new credit as an NGO"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized - Only NGOs can create credits"}), 403
    
    data = request.json
    if not data or 'name' not in data or 'amount' not in data or 'price' not in data:
        return jsonify({"message": "Missing required fields"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get user id
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    credit_id = str(uuid.uuid4())
    description = data.get('description', f"Carbon credit: {data['name']}")
    
    # Insert new credit
    cursor.execute(
        '''INSERT INTO credits 
           (id, name, description, amount, price, creator_id, docu_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (credit_id, data['name'], description, data['amount'], data['price'], user['id'], data.get('docu_url', ''))
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "Credit created successfully",
        "credit_id": credit_id
    }), 201

@app.route('/api/buyer/credits', methods=['GET'])
@jwt_required(optional=True)
def buyer_credits():
    """Get all available credits for buyers"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all active and verified credits
    cursor.execute('''
    SELECT c.*, u.username as creator_name
    FROM credits c
    JOIN users u ON c.creator_id = u.id
    WHERE c.is_active = 1 AND c.is_expired = 0
    ''')
    
    credits = []
    for row in cursor.fetchall():
        credits.append({
            "id": row['id'],
            "name": row['name'],
            "description": row['description'],
            "amount": row['amount'],
            "price": row['price'],
            "creator": row['creator_id'],
            "creator_name": row['creator_name'],
            "is_verified": bool(row['is_verified']),
            "secure_url": row['docu_url'] or "https://example.com/default"
        })
    
    conn.close()
    
    return jsonify(credits), 200

@app.route('/api/buyer/credits/<credit_id>', methods=['GET'])
@jwt_required(optional=True)
def get_credit_details(credit_id):
    """Get details of a specific credit"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get credit details
    cursor.execute('''
    SELECT c.*, u.username as creator_name 
    FROM credits c
    JOIN users u ON c.creator_id = u.id
    WHERE c.id = ?
    ''', (credit_id,))
    
    credit = cursor.fetchone()
    
    if not credit:
        conn.close()
        return jsonify({"message": "Credit not found"}), 404
    
    credit_data = {
        "id": credit['id'],
        "name": credit['name'],
        "description": credit['description'],
        "amount": credit['amount'],
        "price": credit['price'],
        "creator": credit['creator_id'],
        "creator_name": credit['creator_name'],
        "is_active": bool(credit['is_active']),
        "is_expired": bool(credit['is_expired']),
        "is_verified": bool(credit['is_verified']),
        "created_at": credit['created_at'],
        "secure_url": credit['docu_url'] or "https://example.com/default"
    }
    
    conn.close()
    
    return jsonify(credit_data), 200

@app.route('/api/buyer/purchase', methods=['POST'])
@jwt_required()
def purchase_credit():
    """Purchase a credit as a buyer"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'buyer':
        return jsonify({"message": "Unauthorized - Only buyers can purchase credits"}), 403
    
    data = request.json
    if not data or 'credit_id' not in data or 'amount' not in data:
        return jsonify({"message": "Missing required fields"}), 400
    
    amount = data['amount']
    if not isinstance(amount, int) or amount <= 0:
        return jsonify({"message": "Amount must be a positive integer"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get credit details
    cursor.execute('SELECT * FROM credits WHERE id = ?', (data['credit_id'],))
    credit = cursor.fetchone()
    
    if not credit:
        conn.close()
        return jsonify({"message": "Credit not found"}), 404
    
    if not credit['is_active'] or credit['is_expired']:
        conn.close()
        return jsonify({"message": "Credit is not available for purchase"}), 400
    
    if credit['amount'] < amount:
        conn.close()
        return jsonify({"message": f"Not enough credits available. Only {credit['amount']} left."}), 400
    
    # Get buyer details
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    buyer = cursor.fetchone()
    
    if not buyer:
        conn.close()
        return jsonify({"message": "Buyer not found"}), 404
    
    # Create transaction
    transaction_id = str(uuid.uuid4())
    user_credit_id = str(uuid.uuid4())
    
    # Record transaction
    cursor.execute(
        '''INSERT INTO transactions 
           (id, credit_id, seller_id, buyer_id, amount, price) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        (transaction_id, credit['id'], credit['creator_id'], buyer['id'], amount, credit['price'])
    )
    
    # Update credit amount
    cursor.execute(
        'UPDATE credits SET amount = amount - ? WHERE id = ?',
        (amount, credit['id'])
    )
    
    # Record ownership
    cursor.execute(
        '''INSERT INTO user_credits 
           (id, user_id, credit_id, amount) 
           VALUES (?, ?, ?, ?)''',
        (user_credit_id, buyer['id'], credit['id'], amount)
    )
    
    conn.commit()
    
    # Generate certificate
    certificate_id = str(uuid.uuid4())
    certificate_path = f"certificate_{buyer['id']}_{credit['id']}_{transaction_id}.pdf"
    
    cursor.execute(
        '''INSERT INTO certificates 
           (id, user_id, credit_id, transaction_id, certificate_path) 
           VALUES (?, ?, ?, ?, ?)''',
        (certificate_id, buyer['id'], credit['id'], transaction_id, certificate_path)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "Credit purchased successfully",
        "transaction_id": transaction_id,
        "certificate_id": certificate_id
    }), 201

@app.route('/api/buyer/purchased', methods=['GET'])
@jwt_required()
def get_purchased_credits():
    """Get credits purchased by the buyer"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'buyer':
        return jsonify({"message": "Unauthorized - Only buyers can access this endpoint"}), 403
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get buyer's ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    buyer = cursor.fetchone()
    
    if not buyer:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    # Get all purchased credits
    cursor.execute('''
    SELECT uc.*, c.name, c.description, c.price, u.username as seller_name
    FROM user_credits uc
    JOIN credits c ON uc.credit_id = c.id
    JOIN users u ON c.creator_id = u.id
    WHERE uc.user_id = ?
    ''', (buyer['id'],))
    
    credits = []
    for row in cursor.fetchall():
        # Check if certificate exists
        cursor.execute(
            'SELECT id FROM certificates WHERE user_id = ? AND credit_id = ?',
            (buyer['id'], row['credit_id'])
        )
        certificate = cursor.fetchone()
        
        credits.append({
            "id": row['id'],
            "credit_id": row['credit_id'],
            "name": row['name'],
            "description": row['description'],
            "amount": row['amount'],
            "price": row['price'],
            "seller_name": row['seller_name'],
            "purchase_date": row['purchase_date'],
            "is_on_sale": bool(row['is_on_sale']),
            "sale_price": row['sale_price'],
            "has_certificate": certificate is not None
        })
    
    conn.close()
    
    return jsonify(credits), 200

@app.route('/api/NGO/transactions', methods=['GET'])
@jwt_required()
def get_ngo_transactions():
    """Get transactions related to an NGO's credits"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized - Only NGOs can access this endpoint"}), 403
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get NGO's ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    ngo = cursor.fetchone()
    
    if not ngo:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    # Get all transactions where NGO is the seller
    cursor.execute('''
    SELECT t.*, c.name as credit_name, u.username as buyer_name
    FROM transactions t
    JOIN credits c ON t.credit_id = c.id
    JOIN users u ON t.buyer_id = u.id
    WHERE t.seller_id = ?
    ORDER BY t.transaction_date DESC
    ''', (ngo['id'],))
    
    transactions = []
    for row in cursor.fetchall():
        transactions.append({
            "id": row['id'],
            "credit_id": row['credit_id'],
            "credit_name": row['credit_name'],
            "buyer_name": row['buyer_name'],
            "amount": row['amount'],
            "price": row['price'],
            "total_price": row['amount'] * row['price'],
            "transaction_date": row['transaction_date']
        })
    
    conn.close()
    
    return jsonify(transactions), 200

# Auxiliary endpoint used by frontend to estimate auditors needed
@app.route('/api/NGO/audit-req', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_audit_requirement():
    """Return a simple estimate of required auditors based on amount.
    This is a lightweight helper used by the UI; it does not mutate state.
    """
    try:
        amount = request.args.get('amount', default=0, type=int)
    except Exception:
        amount = 0
    # Very simple heuristic: at least 1 auditor, plus one per 100 units
    required = max(1, (amount // 100) + (1 if amount % 100 else 0)) if amount > 0 else 1
    return jsonify({"required_auditors": required}), 200

# Auditor API Routes

@app.route('/api/auditor/credits', methods=['GET'])
@jwt_required()
def get_assigned_credits():
    """Get credits assigned to an auditor"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'auditor':
        return jsonify({"message": "Unauthorized - Only auditors can access this endpoint"}), 403
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get auditor's ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    auditor = cursor.fetchone()
    
    if not auditor:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    # Get all credits to audit (not verified yet)
    # In a real system, there would be an assignment process
    cursor.execute('''
    SELECT c.*, u.username as creator_name
    FROM credits c
    JOIN users u ON c.creator_id = u.id
    WHERE c.is_verified = 0 AND c.is_expired = 0
    ''')
    
    credits = []
    for row in cursor.fetchall():
        # Check if there's an existing audit request
        cursor.execute(
            '''SELECT * FROM audit_requests 
               WHERE credit_id = ? AND auditor_id = ?''',
            (row['id'], auditor['id'])
        )
        audit = cursor.fetchone()
        
        status = audit['status'] if audit else 'unassigned'
        
        credits.append({
            "id": row['id'],
            "name": row['name'],
            "description": row['description'],
            "amount": row['amount'],
            "price": row['price'],
            "creator": row['creator_id'],
            "creator_name": row['creator_name'],
            "is_active": bool(row['is_active']),
            "status": status,
            "created_at": row['created_at'],
            "docu_url": row['docu_url']
        })
    
    # If no credits found, create some test credits for demo purposes
    if not credits:
        # Find an NGO user
        cursor.execute('SELECT id FROM users WHERE role = "NGO" LIMIT 1')
        ngo = cursor.fetchone()
        
        if ngo:
            # Create a test credit
            credit_id = create_dummy_credit(ngo['id'], "Test Credit for Audit", 50, 0.2)
            
            # Fetch the created credit
            cursor.execute('''
            SELECT c.*, u.username as creator_name
            FROM credits c
            JOIN users u ON c.creator_id = u.id
            WHERE c.id = ?
            ''', (credit_id,))
            
            row = cursor.fetchone()
            if row:
                credits.append({
                    "id": row['id'],
                    "name": row['name'],
                    "description": row['description'],
                    "amount": row['amount'],
                    "price": row['price'],
                    "creator": row['creator_id'],
                    "creator_name": row['creator_name'],
                    "is_active": bool(row['is_active']),
                    "status": 'unassigned',
                    "created_at": row['created_at'],
                    "docu_url": row['docu_url']
                })
    
    conn.close()
    
    return jsonify(credits), 200

@app.route('/api/auditor/audit/<credit_id>', methods=['PATCH'])
@jwt_required()
def audit_credit(credit_id):
    """Audit a credit"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'auditor':
        return jsonify({"message": "Unauthorized - Only auditors can audit credits"}), 403
    
    data = request.json
    if not data or 'action' not in data:
        return jsonify({"message": "Missing required fields"}), 400
    
    if data['action'] not in ['approve', 'reject']:
        return jsonify({"message": "Invalid action"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get auditor's ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    auditor = cursor.fetchone()
    
    if not auditor:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    # Check if credit exists
    cursor.execute('SELECT * FROM credits WHERE id = ?', (credit_id,))
    credit = cursor.fetchone()
    
    if not credit:
        conn.close()
        return jsonify({"message": "Credit not found"}), 404
    
    # Create or update audit request
    cursor.execute(
        'SELECT * FROM audit_requests WHERE credit_id = ? AND auditor_id = ?',
        (credit_id, auditor['id'])
    )
    existing_audit = cursor.fetchone()
    
    if existing_audit:
        cursor.execute(
            '''UPDATE audit_requests 
               SET status = ?, completion_date = CURRENT_TIMESTAMP, notes = ? 
               WHERE id = ?''',
            ('approved' if data['action'] == 'approve' else 'rejected', 
             data.get('notes', ''), existing_audit['id'])
        )
    else:
        audit_id = str(uuid.uuid4())
        cursor.execute(
            '''INSERT INTO audit_requests 
               (id, credit_id, auditor_id, status, completion_date, notes) 
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)''',
            (audit_id, credit_id, auditor['id'], 
             'approved' if data['action'] == 'approve' else 'rejected', 
             data.get('notes', ''))
        )
    
    # Update credit verification status if approved
    if data['action'] == 'approve':
        cursor.execute(
            'UPDATE credits SET is_verified = 1 WHERE id = ?',
            (credit_id,)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": f"Credit {data['action']}d successfully",
        "credit_id": credit_id
    }), 200

# Certificate API

@app.route('/api/buyer/generate-certificate/<credit_id>', methods=['GET'])
@jwt_required()
def generate_certificate(credit_id):
    """Generate a certificate for a purchased credit"""
    current_user = json.loads(get_jwt_identity())
    
    if current_user.get('role') != 'buyer':
        return jsonify({"message": "Unauthorized - Only buyers can generate certificates"}), 403
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get buyer's ID
    cursor.execute('SELECT id FROM users WHERE username = ?', (current_user['username'],))
    buyer = cursor.fetchone()
    
    if not buyer:
        conn.close()
        return jsonify({"message": "User not found"}), 404
    
    # Check if user owns this credit
    cursor.execute(
        'SELECT * FROM user_credits WHERE user_id = ? AND credit_id = ?',
        (buyer['id'], credit_id)
    )
    user_credit = cursor.fetchone()
    
    if not user_credit:
        conn.close()
        return jsonify({"message": "You do not own this credit"}), 403
    
    # Check if certificate already exists
    cursor.execute(
        'SELECT * FROM certificates WHERE user_id = ? AND credit_id = ?',
        (buyer['id'], credit_id)
    )
    certificate = cursor.fetchone()
    
    if not certificate:
        # Create a new certificate
        certificate_id = str(uuid.uuid4())
        certificate_path = f"certificate_{buyer['id']}_{credit_id}.pdf"
        
        cursor.execute(
            '''INSERT INTO certificates 
               (id, user_id, credit_id, certificate_path) 
               VALUES (?, ?, ?, ?)''',
            (certificate_id, buyer['id'], credit_id, certificate_path)
        )
        conn.commit()
    
    # Return certificate details
    cursor.execute(
        '''SELECT c.*, cr.name as credit_name, u.username 
           FROM certificates c
           JOIN credits cr ON c.credit_id = cr.id
           JOIN users u ON c.user_id = u.id
           WHERE c.user_id = ? AND c.credit_id = ?''',
        (buyer['id'], credit_id)
    )
    cert = cursor.fetchone()
    
    conn.close()
    
    if not cert:
        return jsonify({"message": "Error generating certificate"}), 500
    
    return jsonify({
        "message": "Certificate generated successfully",
        "certificate_id": cert['id'],
        "credit_name": cert['credit_name'],
        "owner": cert['username'],
        "generated_at": cert['generated_at']
    }), 200

@app.route('/api/buyer/download-certificate/<credit_id>', methods=['GET'])
@jwt_required()
def download_certificate(credit_id):
    """Download a certificate for a purchased credit"""
    current_user = json.loads(get_jwt_identity())
    
    # In a real system, we would generate a real PDF here
    # For demo purposes, we'll just return a text response
    
    return Response(
        f"This is a certificate for Credit ID: {credit_id}\n"
        f"Issued to: {current_user['username']}\n"
        f"Date: {datetime.now().strftime('%Y-%m-%d')}\n"
        f"This certificate validates ownership of carbon credits.",
        mimetype='text/plain'
    )

# Main execution
if __name__ == '__main__':
    print("Starting full-featured backend server...")
    app.run(host='0.0.0.0', port=5000, debug=True)

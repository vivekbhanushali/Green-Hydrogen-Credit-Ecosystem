"""
Simple login test for Carbon Credit Platform
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
import uuid

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Setup SQLite database
DB_PATH = 'simple_login_test.db'

def create_test_db():
    """Create a simple test database with users"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')
    
    # Delete any existing test users
    cursor.execute('DELETE FROM users WHERE username IN (?, ?, ?)', 
                  ('test_buyer', 'test_ngo', 'test_auditor'))
    
    # Create test password
    password = 'sepolia'
    password_hash = generate_password_hash(password)
    print(f"Password hash for '{password}': {password_hash}")
    
    # Insert test users
    test_users = [
        (str(uuid.uuid4()), 'test_buyer', password_hash, 'buyer'),
        (str(uuid.uuid4()), 'test_ngo', password_hash, 'NGO'),
        (str(uuid.uuid4()), 'test_auditor', password_hash, 'auditor')
    ]
    
    cursor.executemany('INSERT INTO users VALUES (?, ?, ?, ?)', test_users)
    
    # Verify users were added
    cursor.execute('SELECT username, role FROM users')
    users = cursor.fetchall()
    print("Users in database:")
    for user in users:
        print(f"- {user[0]} (role: {user[1]})")
    
    conn.commit()
    conn.close()

# Create the test database
create_test_db()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    print(f"Login attempt with data: {data}")
    
    if not data or 'username' not in data or 'password' not in data or 'role' not in data:
        print("Missing required fields")
        return jsonify({"message": "Missing required fields"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (data['username'],))
    user = cursor.fetchone()
    
    if user:
        print(f"Found user: {user['username']} with role {user['role']}")
        password_matches = check_password_hash(user['password'], data['password'])
        print(f"Password match: {password_matches}")
        
        if password_matches:
            if user['role'] != data['role']:
                print(f"Role mismatch: {user['role']} vs {data['role']}")
                conn.close()
                return jsonify({"message": "Role mismatch"}), 403
            
            print("Login successful!")
            conn.close()
            return jsonify({"message": "Login successful", "role": user['role']}), 200
    else:
        print(f"No user found with username: {data['username']}")
    
    conn.close()
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/users', methods=['GET'])
def list_users():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, username, role FROM users')
    users = [dict(user) for user in cursor.fetchall()]
    
    conn.close()
    return jsonify(users), 200

if __name__ == '__main__':
    print("Starting simple login test server...")
    app.run(host='0.0.0.0', port=5000, debug=True)

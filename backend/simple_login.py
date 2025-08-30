"""
Very simple login test with hardcoded users
"""
from flask import Flask, jsonify, request
from flask_cors import CORS

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Hardcoded test users - no database dependency
USERS = {
    "test_buyer": {"password": "sepolia", "role": "buyer"},
    "test_admin": {"password": "sepolia", "role": "NGO"},
    "test_auditor": {"password": "sepolia", "role": "auditor"}
}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Simple login test server running"}), 200

@app.route('/api/users', methods=['GET'])
def users():
    return jsonify([{"username": username, "role": user["role"]} for username, user in USERS.items()]), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    print(f"Login attempt: {data}")
    
    if not data or 'username' not in data or 'password' not in data or 'role' not in data:
        print("Missing required fields")
        return jsonify({"message": "Missing required fields"}), 400
    
    username = data['username']
    password = data['password']
    role = data['role']
    
    if username not in USERS:
        print(f"User not found: {username}")
        return jsonify({"message": "Invalid credentials"}), 401
    
    user = USERS[username]
    
    if user["password"] != password:
        print(f"Password mismatch for {username}")
        return jsonify({"message": "Invalid credentials"}), 401
    
    if user["role"] != role:
        print(f"Role mismatch for {username}: expected {user['role']}, got {role}")
        return jsonify({"message": "Incorrect role"}), 403
    
    print(f"Login successful for {username} with role {role}")
    return jsonify({
        "access_token": f"dummy_token_{username}_{role}",
        "role": role
    }), 200

if __name__ == '__main__':
    print("Starting simple login test server on port 5000...")
    print(f"Available users: {list(USERS.keys())}")
    app.run(host='0.0.0.0', port=5000, debug=True)

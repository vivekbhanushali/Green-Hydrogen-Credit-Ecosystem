from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return {"status": "healthy", "message": "Backend is running!"}

@app.route('/api/test', methods=['GET'])
def test():
    return {"message": "Test endpoint working!"}

# Authentication endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    role = data.get('role', '')
    
    # Mock authentication - accept any login for demo
    if username and password:
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": 1,
                "username": username,
                "role": role,
                "email": f"{username}@example.com"
            },
            "token": "mock_jwt_token_12345"
        })
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    return jsonify({
        "success": True,
        "message": "Signup successful",
        "user": {
            "id": 1,
            "username": data.get('username', ''),
            "role": data.get('role', ''),
            "email": data.get('email', '')
        }
    })

@app.route('/api/profile', methods=['GET'])
def get_profile():
    # Mock profile data - in real app this would come from JWT token
    return jsonify({
        "data": {
            "id": 1,
            "username": "demo_user",
            "role": "buyer",
            "email": "demo@example.com"
        }
    })

# Mock data endpoints
@app.route('/api/buyer/credits', methods=['GET'])
def get_buyer_credits():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "Wind H₂ Production",
                "amount": 100,
                "price": 0.5,
                "creator": {"username": "wind_ngo"},
                "is_active": True,
                "is_expired": False,
                "secure_url": "https://example.com/docs"
            }
        ]
    })

@app.route('/api/buyer/purchased', methods=['GET'])
def get_purchased_credits():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "Wind H₂ Credits",
                "amount": 50,
                "price": 0.3,
                "creator": {"username": "wind_ngo"},
                "is_active": False,
                "is_expired": True,
                "secure_url": "https://example.com/docs"
            }
        ]
    })

@app.route('/api/buyer/portfolio-analytics', methods=['GET'])
def get_portfolio_analytics():
    return jsonify({
        "data": {
            "totalInvested": 150.00,
            "currentValue": 175.50,
            "profitLoss": 25.50,
            "profitLossPercentage": 17.0,
            "hydrogenOffset": 75.5,
            "creditsCount": 3
        }
    })

@app.route('/api/buyer/market-trends', methods=['GET'])
def get_market_trends():
    return jsonify({
        "data": [
            {"name": "Wind H₂", "trend": "up", "percentage": 15.2, "volume": "2.1M kg"}
        ]
    })

@app.route('/api/buyer/recommendations', methods=['GET'])
def get_recommendations():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "Wind H₂ Production",
                "amount": 200,
                "price": 0.4,
                "creator": {"username": "wind_ngo"},
                "score": 95,
                "reason": "High efficiency, low hydrogen footprint"
            }
        ]
    })

@app.route('/api/buyer/notifications', methods=['GET'])
def get_notifications():
    return jsonify({
        "data": [
            {
                "id": 1,
                "type": "success",
                "message": "Your H₂ credits have been verified!",
                "time": "2 minutes ago"
            }
        ]
    })

@app.route('/api/NGO/credits', methods=['GET'])
def get_ngo_credits():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "Green H₂ Project",
                "amount": 150,
                "price": 0.6,
                "is_active": True
            }
        ]
    })

@app.route('/api/auditor/credits', methods=['GET'])
def get_auditor_credits():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "H₂ Verification Project",
                "amount": 75,
                "price": 0.4,
                "secure_url": "https://example.com/docs"
            }
        ]
    })

@app.route('/api/buyer/purchased-credits', methods=['GET'])
def get_purchased_credits():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "Wind H₂ Credit - 100kg",
                "amount": 100,
                "price": 0.5,
                "secure_url": "https://example.com/docs"
            }
        ]
    })

@app.route('/api/NGO/my-credits', methods=['GET'])
def get_ngo_my_credits():
    return jsonify({
        "data": [
            {
                "id": 1,
                "name": "Green H₂ Project - 150kg",
                "amount": 150,
                "price": 0.6,
                "secure_url": "https://example.com/docs"
            }
        ]
    })

# Auto-generated credits endpoint
@app.route('/api/credits/auto-generated', methods=['GET'])
def get_auto_generated_credits():
    return jsonify({
        "data": [
            {
                "id": "CREDIT_20250830_1234",
                "name": "Wind H₂ Credit - 200kg",
                "amount": 200,
                "price": 500.0,
                "creator": {"username": "wind_ngo"},
                "is_active": True,
                "is_expired": False,
                "secure_url": "https://example.com/docs/CREDIT_20250830_1234",
                "production_method": "wind",
                "energy_input": 10,
                "efficiency": 50.0,
                "ml_verification_score": 0.95,
                "auto_generated": True,
                "generated_at": "2025-08-30T10:00:00"
            },
            {
                "id": "CREDIT_20250830_5678",
                "name": "Wind H₂ Credit - 150kg",
                "amount": 150,
                "price": 375.0,
                "creator": {"username": "wind_ngo"},
                "is_active": True,
                "is_expired": False,
                "secure_url": "https://example.com/docs/CREDIT_20250830_5678",
                "production_method": "wind",
                "energy_input": 8,
                "efficiency": 53.3,
                "ml_verification_score": 0.88,
                "auto_generated": True,
                "generated_at": "2025-08-30T09:30:00"
            }
        ]
    })

# Advanced ML Verification endpoints
@app.route('/api/verification/submit', methods=['POST'])
def submit_verification():
    data = request.get_json()
    energy_mwh = float(data.get('energy_mwh', 10))
    h2_kg = float(data.get('h2_kg', 200))
    production_method = data.get('production_method', 'wind')
    
    # Simulate advanced ML verification
    efficiency = (energy_mwh * 1000) / h2_kg
    is_valid = 40 <= efficiency <= 55  # Wind H₂ efficiency range
    
    ml_result = {
        "verification_id": f"VER_{datetime.now().strftime('%Y%m%d')}_{np.random.randint(1000, 9999)}",
        "timestamp": datetime.now().isoformat(),
        "model_version": "2.0.0",
        "is_valid": is_valid,
        "composite_score": 0.95 if is_valid else 0.35,
        "fraud_probability": 0.05 if is_valid else 0.75,
        "confidence_level": 0.92 if is_valid else 0.45,
        "calculated_efficiency": efficiency,
        "efficiency_score": 0.95 if is_valid else 0.25,
        "efficiency_rating": "excellent" if 40 <= efficiency <= 47.5 else "good" if 47.5 < efficiency <= 55 else "poor",
        "anomaly_detection": {
            "detected_anomalies": [] if is_valid else ["suspicious_efficiency"],
            "anomaly_score": 0.0 if is_valid else 0.6,
            "severity": "low" if is_valid else "high"
        },
        "risk_assessment": {
            "risk_score": 0.1 if is_valid else 0.7,
            "risk_level": "low" if is_valid else "high",
            "risk_factors": [] if is_valid else ["low_efficiency"],
            "mitigation_suggestions": ["Production data appears valid"] if is_valid else ["Implement efficiency optimization measures"]
        },
        "recommendations": ["Approve for credit issuance"] if is_valid else ["Investigate efficiency issues"],
        "next_steps": ["Monitor for future consistency"] if is_valid else ["Request comprehensive audit"]
    }
    
    # AUTO-CREATE CREDIT if ML verification passes
    if is_valid:
        credit_id = f"CREDIT_{datetime.now().strftime('%Y%m%d')}_{np.random.randint(1000, 9999)}"
        credit_value = h2_kg * 2.5  # $2.5 per kg H₂
        
        auto_credit = {
            "id": credit_id,
            "name": f"Wind H₂ Credit - {h2_kg}kg",
            "amount": h2_kg,
            "price": credit_value,
            "creator": {"username": "wind_ngo"},
            "is_active": True,
            "is_expired": False,
            "secure_url": f"https://example.com/docs/{credit_id}",
            "production_method": production_method,
            "energy_input": energy_mwh,
            "efficiency": efficiency,
            "ml_verification_score": ml_result["composite_score"],
            "auto_generated": True,
            "generated_at": datetime.now().isoformat()
        }
        
        return jsonify({
            "success": True,
            "message": "✅ ML Verification PASSED! Credit automatically created!",
            "verification_id": ml_result["verification_id"],
            "ml_verification": ml_result,
            "status": "approved",
            "auto_credit": auto_credit,
            "credit_created": True
        })
    else:
        return jsonify({
            "success": False,
            "message": "❌ ML Verification FAILED! No credit created.",
            "verification_id": ml_result["verification_id"],
            "ml_verification": ml_result,
            "status": "rejected",
            "credit_created": False
        })

@app.route('/api/verification/ml-verify', methods=['POST'])
def ml_verify():
    data = request.get_json()
    energy_mwh = float(data.get('energy_mwh', 10))
    h2_kg = float(data.get('h2_kg', 200))
    production_method = data.get('production_method', 'wind')
    
    efficiency = (energy_mwh * 1000) / h2_kg
    is_valid = 40 <= efficiency <= 55  # Wind H₂ efficiency range
    
    result = {
        "verification_id": f"VER_{datetime.now().strftime('%Y%m%d')}_{np.random.randint(1000, 9999)}",
        "is_valid": is_valid,
        "composite_score": 0.95 if is_valid else 0.35,
        "fraud_probability": 0.05 if is_valid else 0.75,
        "confidence_level": 0.92 if is_valid else 0.45,
        "calculated_efficiency": efficiency,
        "efficiency_rating": "excellent" if 40 <= efficiency <= 47.5 else "good" if 47.5 < efficiency <= 55 else "poor"
    }
    
    # AUTO-CREATE CREDIT if ML verification passes
    if is_valid:
        credit_id = f"CREDIT_{datetime.now().strftime('%Y%m%d')}_{np.random.randint(1000, 9999)}"
        credit_value = h2_kg * 2.5  # $2.5 per kg H₂
        
        auto_credit = {
            "id": credit_id,
            "name": f"Wind H₂ Credit - {h2_kg}kg",
            "amount": h2_kg,
            "price": credit_value,
            "creator": {"username": "wind_ngo"},
            "is_active": True,
            "is_expired": False,
            "secure_url": f"https://example.com/docs/{credit_id}",
            "production_method": production_method,
            "energy_input": energy_mwh,
            "efficiency": efficiency,
            "ml_verification_score": result["composite_score"],
            "auto_generated": True,
            "generated_at": datetime.now().isoformat()
        }
        
        return jsonify({
            "ml_verification": result,
            "recommendation": "APPROVED",
            "credit_created": True,
            "auto_credit": auto_credit,
            "message": "✅ ML Verification PASSED! Credit automatically created!"
        })
    else:
        return jsonify({
            "ml_verification": result,
            "recommendation": "REJECTED",
            "credit_created": False,
            "message": "❌ ML Verification FAILED! No credit created."
        })

@app.route('/api/verification/pending', methods=['GET'])
def get_pending_verifications():
    return jsonify({
        "data": [
            {
                "id": 1,
                "industry_name": "Green Energy Corp",
                "hydrogen_amount": 200,
                "production_method": "wind",
                "production_date": "2025-08-30",
                "created_at": "2025-08-30 09:15",
                "documents_count": 3,
                "ml_verification": {
                    "composite_score": 0.95,
                    "fraud_probability": 0.05,
                    "confidence_level": 0.92,
                    "efficiency_rating": "excellent",
                    "anomaly_detection": {"anomaly_score": 0.0, "severity": "low"},
                    "risk_assessment": {"risk_level": "low"}
                }
            },
            {
                "id": 2,
                "industry_name": "Wind Energy Solutions",
                "hydrogen_amount": 150,
                "production_method": "wind",
                "production_date": "2025-08-29",
                "created_at": "2025-08-29 14:30",
                "documents_count": 2,
                "ml_verification": {
                    "composite_score": 0.88,
                    "fraud_probability": 0.12,
                    "confidence_level": 0.85,
                    "efficiency_rating": "good",
                    "anomaly_detection": {"anomaly_score": 0.1, "severity": "low"},
                    "risk_assessment": {"risk_level": "low"}
                }
            }
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting simplified backend server...")
    app.run(debug=True, host='0.0.0.0', port=5000)

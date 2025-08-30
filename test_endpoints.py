import requests
import json

# Test the endpoints
base_url = "http://localhost:5000/api"

print("Testing backend endpoints...")

# Test health endpoint
try:
    response = requests.get(f"{base_url}/health")
    print(f"✅ Health check: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"❌ Health check failed: {e}")

# Test login with test user
try:
    login_data = {
        "username": "test_buyer",
        "password": "123456",
        "role": "buyer"
    }
    response = requests.post(f"{base_url}/login", json=login_data)
    print(f"✅ Login test: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"❌ Login test failed: {e}")

# Test signup
try:
    signup_data = {
        "username": "test_new_user",
        "email": "new@test.com",
        "password": "123456",
        "role": "buyer"
    }
    response = requests.post(f"{base_url}/signup", json=signup_data)
    print(f"✅ Signup test: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"❌ Signup test failed: {e}")

print("\nBackend test completed!")




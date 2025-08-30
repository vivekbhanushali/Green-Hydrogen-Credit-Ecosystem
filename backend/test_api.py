import requests
import json

print("Testing login with test_buyer account...")
response = requests.post(
    'http://127.0.0.1:5000/api/login',
    json={
        'username': 'test_buyer',
        'password': 'sepolia',
        'role': 'buyer'
    }
)
print(f'Response: {response.status_code}')
print(f'Response text: {response.text}')

# Try to get test users
print("\nGetting list of users...")
response = requests.get('http://127.0.0.1:5000/api/test-users')
print(f'Response: {response.status_code}')
print(f'Response text: {response.text}')

# Try health endpoint
print("\nChecking health endpoint...")
response = requests.get('http://127.0.0.1:5000/api/health')
print(f'Response: {response.status_code}')
print(f'Response text: {response.text}')

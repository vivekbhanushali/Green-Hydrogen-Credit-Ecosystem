from app import create_app, db, bcrypt
from app.models.user import User

app = create_app()

with app.app_context():
    # Test users data
    test_users = [
        {
            'username': 'test_buyer',
            'email': 'buyer@test.com',
            'password': '123456',
            'role': 'buyer'
        },
        {
            'username': 'test_ngo',
            'email': 'ngo@test.com',
            'password': '123456',
            'role': 'NGO'
        },
        {
            'username': 'test_auditor',
            'email': 'auditor@test.com',
            'password': '123456',
            'role': 'auditor'
        },
        {
            'username': 'admin',
            'email': 'admin@test.com',
            'password': 'admin123',
            'role': 'buyer'
        }
    ]
    
    for user_data in test_users:
        existing_user = User.query.filter_by(username=user_data['username']).first()
        if not existing_user:
            hashed_password = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
            new_user = User(
                username=user_data['username'],
                email=user_data['email'],
                password=hashed_password,
                role=user_data['role']
            )
            db.session.add(new_user)
            print(f"✅ Created {user_data['role']} user: {user_data['username']}")
        else:
            print(f"⚠️  {user_data['role']} user already exists: {user_data['username']}")

    db.session.commit()
    
    print("\n" + "="*50)
    print("🎯 TEST USERS FOR QUICK LOGIN")
    print("="*50)
    print("👤 BUYER:")
    print("   Username: test_buyer")
    print("   Password: 123456")
    print("   Email: buyer@test.com")
    print()
    print("🌱 NGO:")
    print("   Username: test_ngo")
    print("   Password: 123456")
    print("   Email: ngo@test.com")
    print()
    print("🔍 AUDITOR:")
    print("   Username: test_auditor")
    print("   Password: 123456")
    print("   Email: auditor@test.com")
    print()
    print("👨‍💼 ADMIN:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Email: admin@test.com")
    print("="*50)

from app import create_app, db, bcrypt
from app.models.user import User

app = create_app()

with app.app_context():
    # Delete all existing users
    User.query.delete()
    db.session.commit()
    print("🗑️  Deleted all existing users")
    
    # Create fresh test users
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
        }
    ]
    
    for user_data in test_users:
        hashed_password = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
        new_user = User(
            username=user_data['username'],
            email=user_data['email'],
            password=hashed_password,
            role=user_data['role']
        )
        db.session.add(new_user)
        print(f"✅ Created {user_data['role']} user: {user_data['username']}")

    db.session.commit()
    
    print("\n" + "="*50)
    print("🎯 FRESH TEST USERS CREATED")
    print("="*50)
    print("👤 BUYER:")
    print("   Username: test_buyer")
    print("   Password: 123456")
    print()
    print("🌱 NGO:")
    print("   Username: test_ngo")
    print("   Password: 123456")
    print()
    print("🔍 AUDITOR:")
    print("   Username: test_auditor")
    print("   Password: 123456")
    print("="*50)




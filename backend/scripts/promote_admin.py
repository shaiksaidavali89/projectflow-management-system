
from app.database import SessionLocal
from app.models import User, Role


db = SessionLocal()

try:
    email = input("Enter your registered email: ").strip().lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        print("User not found. Please check the email.")
    else:
        admin_role = db.query(Role).filter(
            Role.name == "Admin"
        ).first()

        if not admin_role:
            admin_role = Role(name="Admin")
            db.add(admin_role)
            db.flush()

        user.role_id = admin_role.id
        db.commit()

        print("Admin role assigned successfully!")
        print("Name:", user.full_name)
        print("Email:", user.email)
        print("Role: Admin")

except Exception as error:
    db.rollback()
    print("Error:", error)

finally:
    db.close()

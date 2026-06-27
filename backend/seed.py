from backend.database import Base, engine, SessionLocal
from backend import models
from backend.services import auth

def seed_database():
    db = SessionLocal()
    try:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("Creating all tables from scratch...")
        Base.metadata.create_all(bind=engine)

        print("Registering developer shortcut accounts...")
        # Preset developer shortcuts details
        shortcuts = [
            {"name": "Contractor Executive", "email": "contractor@astrobuilds.com", "role": "Contractor"},
            {"name": "Lead Site Engineer", "email": "engineer@astrobuilds.com", "role": "Site Engineer"},
            {"name": "Project Owner Admin", "email": "owner@astrobuilds.com", "role": "Project Owner"},
        ]

        pwd_hash = auth.get_password_hash("password123")
        for u in shortcuts:
            db_user = models.User(
                name=u["name"],
                email=u["email"],
                password_hash=pwd_hash,
                role=u["role"]
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            # Assign default first-time profile
            profile = models.UserProfile(
                user_id=db_user.id,
                first_time_login=True
            )
            db.add(profile)
            db.commit()

        print("Database cleared and initialized with empty user profiles!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

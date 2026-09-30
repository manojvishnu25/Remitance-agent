from datetime import datetime
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, Corridor, Goal, RemittanceDraft, SimulatedTransaction, GoalAllocation, ActivityLog


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_database(db: Session, reset: bool = False):
    """
    Seeds initial user, corridors, and goals according to project specs.
    If reset=True, clears all transactions, drafts, allocations, logs and resets user and goals.
    """
    if reset:
        # Clear child tables first
        db.query(GoalAllocation).delete()
        db.query(SimulatedTransaction).delete()
        db.query(RemittanceDraft).delete()
        db.query(ActivityLog).delete()
        db.query(Goal).delete()
        db.query(Corridor).delete()
        db.query(User).delete()
        db.commit()

    # Seed User
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(
            id=1,
            name="Demo Student",
            balance=20000.0,
            currency="INR",
            created_at=datetime.utcnow()
        )
        db.add(user)
    elif reset:
        user.balance = 20000.0
        user.name = "Demo Student"
        user.currency = "INR"

    # Seed Multi-Country Corridors (2 options per destination)
    corridors_data = [
        # United States (USD)
        {
            "id": 1,
            "name": "Corridor A (SWIFT Express)",
            "country": "United States",
            "country_code": "US",
            "fee": 150.0,
            "speed_days": 1,
            "fx_rate": 83.10,
            "destination_currency": "USD",
            "currency_symbol": "$",
            "description": "Express Settlement Channel (1-Day Priority)"
        },
        {
            "id": 2,
            "name": "Corridor B (ACH Economy)",
            "country": "United States",
            "country_code": "US",
            "fee": 80.0,
            "speed_days": 2,
            "fx_rate": 82.80,
            "destination_currency": "USD",
            "currency_symbol": "$",
            "description": "Economy Settlement Channel (2-Day Budget)"
        },
        # United Kingdom (GBP)
        {
            "id": 3,
            "name": "UK Priority (Faster Payments)",
            "country": "United Kingdom",
            "country_code": "GB",
            "fee": 180.0,
            "speed_days": 1,
            "fx_rate": 106.50,
            "destination_currency": "GBP",
            "currency_symbol": "£",
            "description": "Instant UK Clearing Network (1-Day Priority)"
        },
        {
            "id": 4,
            "name": "UK Economy (BACS Direct)",
            "country": "United Kingdom",
            "country_code": "GB",
            "fee": 90.0,
            "speed_days": 2,
            "fx_rate": 105.80,
            "destination_currency": "GBP",
            "currency_symbol": "£",
            "description": "Standard UK Interbank Route (2-Day Budget)"
        },
        # European Union (EUR)
        {
            "id": 5,
            "name": "Euro SEPA Instant (Express)",
            "country": "European Union",
            "country_code": "EU",
            "fee": 160.0,
            "speed_days": 1,
            "fx_rate": 90.80,
            "destination_currency": "EUR",
            "currency_symbol": "€",
            "description": "Pan-European SEPA Instant Clearing (1-Day Priority)"
        },
        {
            "id": 6,
            "name": "Euro SEPA Standard (Economy)",
            "country": "European Union",
            "country_code": "EU",
            "fee": 85.0,
            "speed_days": 2,
            "fx_rate": 90.10,
            "destination_currency": "EUR",
            "currency_symbol": "€",
            "description": "Standard European Clearing (2-Day Budget)"
        },
        # Canada (CAD)
        {
            "id": 7,
            "name": "Canada Interac Wire (Express)",
            "country": "Canada",
            "country_code": "CA",
            "fee": 140.0,
            "speed_days": 1,
            "fx_rate": 61.50,
            "destination_currency": "CAD",
            "currency_symbol": "C$",
            "description": "Interac Priority Wire Service (1-Day Priority)"
        },
        {
            "id": 8,
            "name": "Canada EFT Direct (Economy)",
            "country": "Canada",
            "country_code": "CA",
            "fee": 75.0,
            "speed_days": 2,
            "fx_rate": 61.00,
            "destination_currency": "CAD",
            "currency_symbol": "C$",
            "description": "Standard Canadian Bank Clearing (2-Day Budget)"
        },
        # Australia (AUD)
        {
            "id": 9,
            "name": "AusPay Priority (Express)",
            "country": "Australia",
            "country_code": "AU",
            "fee": 150.0,
            "speed_days": 1,
            "fx_rate": 54.90,
            "destination_currency": "AUD",
            "currency_symbol": "A$",
            "description": "NPP Real-Time Settlement Channel (1-Day Priority)"
        },
        {
            "id": 10,
            "name": "AusPay Direct (Economy)",
            "country": "Australia",
            "country_code": "AU",
            "fee": 80.0,
            "speed_days": 2,
            "fx_rate": 54.30,
            "destination_currency": "AUD",
            "currency_symbol": "A$",
            "description": "Direct Entry Standard Settlement (2-Day Budget)"
        },
        # United Arab Emirates (AED)
        {
            "id": 11,
            "name": "UAE Flash Remit (Express)",
            "country": "United Arab Emirates",
            "country_code": "AE",
            "fee": 120.0,
            "speed_days": 1,
            "fx_rate": 22.65,
            "destination_currency": "AED",
            "currency_symbol": "AED ",
            "description": "UAE Central Bank Priority Transfer (1-Day Priority)"
        },
        {
            "id": 12,
            "name": "UAE Regular Wire (Economy)",
            "country": "United Arab Emirates",
            "country_code": "AE",
            "fee": 60.0,
            "speed_days": 2,
            "fx_rate": 22.45,
            "destination_currency": "AED",
            "currency_symbol": "AED ",
            "description": "Standard GCC Interbank Route (2-Day Budget)"
        },
    ]

    for c_data in corridors_data:
        c_obj = db.query(Corridor).filter(Corridor.id == c_data["id"]).first()
        if not c_obj:
            c_obj = Corridor(
                id=c_data["id"],
                name=c_data["name"],
                country=c_data["country"],
                country_code=c_data["country_code"],
                fee=c_data["fee"],
                speed_days=c_data["speed_days"],
                fx_rate=c_data["fx_rate"],
                destination_currency=c_data["destination_currency"],
                currency_symbol=c_data["currency_symbol"],
                description=c_data["description"],
                is_active=True
            )
            db.add(c_obj)
        elif reset:
            c_obj.name = c_data["name"]
            c_obj.country = c_data["country"]
            c_obj.country_code = c_data["country_code"]
            c_obj.fee = c_data["fee"]
            c_obj.speed_days = c_data["speed_days"]
            c_obj.fx_rate = c_data["fx_rate"]
            c_obj.destination_currency = c_data["destination_currency"]
            c_obj.currency_symbol = c_data["currency_symbol"]
            c_obj.description = c_data["description"]
            c_obj.is_active = True

    # Seed Goals
    goal_1 = db.query(Goal).filter(Goal.name == "Exam Fee", Goal.user_id == 1).first()
    if not goal_1:
        goal_1 = Goal(
            user_id=1,
            name="Exam Fee",
            target_amount=5000.0,
            saved_amount=2000.0,
            deadline="2026-11-15",
            status="IN_PROGRESS"
        )
        db.add(goal_1)
    elif reset:
        goal_1.target_amount = 5000.0
        goal_1.saved_amount = 2000.0
        goal_1.status = "IN_PROGRESS"

    goal_2 = db.query(Goal).filter(Goal.name == "Hostel Rent", Goal.user_id == 1).first()
    if not goal_2:
        goal_2 = Goal(
            user_id=1,
            name="Hostel Rent",
            target_amount=8000.0,
            saved_amount=2000.0,
            deadline="2026-12-01",
            status="IN_PROGRESS"
        )
        db.add(goal_2)
    elif reset:
        goal_2.target_amount = 8000.0
        goal_2.saved_amount = 2000.0
        goal_2.status = "IN_PROGRESS"

    # Initial Activity Log
    init_log = ActivityLog(
        user_id=1,
        action="System Initialized" if not reset else "Demo Reset",
        description="Demo environment ready with ₹20,000 balance and initial goals."
    )
    db.add(init_log)

    db.commit()


if __name__ == "__main__":
    init_db()
    with SessionLocal() as session:
        seed_database(session, reset=True)
        print("Database seeded successfully!")

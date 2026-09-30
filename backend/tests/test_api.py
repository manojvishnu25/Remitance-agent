import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.seed import seed_database

# Use in-memory SQLite for testing with StaticPool
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create tables and seed
Base.metadata.create_all(bind=engine)
with TestingSessionLocal() as db:
    seed_database(db, reset=True)

client = TestClient(app)


def test_1_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["simulation_mode"] is True
    assert data["live_banking_connected"] is False


def test_2_corridor_comparison():
    payload = {
        "amount": 10000,
        "deadline": "2026-10-10",
        "country": "United States"
    }
    response = client.post("/api/remittance/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 10000
    assert len(data["options"]) == 2
    # Verify both corridors exist
    corridor_names = [opt["name"] for opt in data["options"]]
    assert any("Corridor A" in name for name in corridor_names)
    assert any("Corridor B" in name for name in corridor_names)

    # Check badges
    for opt in data["options"]:
        assert isinstance(opt["badges"], list)
        assert len(opt["badges"]) > 0


def test_2b_multiple_corridor_destinations():
    # Test destinations endpoint
    dests_resp = client.get("/api/destinations")
    assert dests_resp.status_code == 200
    dests = dests_resp.json()
    countries = [d["country"] for d in dests]
    assert "United States" in countries
    assert "United Kingdom" in countries
    assert "European Union" in countries
    assert "Canada" in countries
    assert "Australia" in countries
    assert "United Arab Emirates" in countries

    # Test UK corridor comparison
    uk_resp = client.post("/api/remittance/compare", json={
        "amount": 10000,
        "deadline": "2026-10-12",
        "country": "United Kingdom"
    })
    assert uk_resp.status_code == 200
    uk_data = uk_resp.json()
    assert len(uk_data["options"]) == 2
    for opt in uk_data["options"]:
        assert opt["destination_currency"] == "GBP"


def test_3_draft_creation():
    payload = {
        "user_id": 1,
        "corridor_id": 1,
        "amount": 5000,
        "deadline": "2026-10-15"
    }
    response = client.post("/api/drafts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "DRAFT"
    assert data["amount"] == 5000
    assert data["fee"] == 150
    assert "suggested_window_display" in data
    assert "October 14, 2026" in data["suggested_window_display"]


def test_4_draft_approval():
    # Create draft
    create_resp = client.post("/api/drafts", json={
        "user_id": 1,
        "corridor_id": 1,
        "amount": 4000,
        "deadline": "2026-10-20"
    })
    draft_id = create_resp.json()["id"]

    # Check dashboard before approval
    dash_before = client.get("/api/dashboard/1").json()
    balance_before = dash_before["available_balance"]

    # Approve draft
    approve_resp = client.post(f"/api/drafts/{draft_id}/approve")
    assert approve_resp.status_code == 200
    approved_data = approve_resp.json()
    assert approved_data["status"] == "APPROVED"
    assert approved_data["approved_at"] is not None

    # Verify balance was deducted by amount + fee (4000 + 150 = 4150)
    dash_after = client.get("/api/dashboard/1").json()
    assert dash_after["available_balance"] == round(balance_before - 4150, 2)
    assert dash_after["simulated_transfers_count"] >= 1


def test_5_draft_cancellation():
    create_resp = client.post("/api/drafts", json={
        "user_id": 1,
        "corridor_id": 2,
        "amount": 2000,
        "deadline": "2026-10-25"
    })
    draft_id = create_resp.json()["id"]

    cancel_resp = client.post(f"/api/drafts/{draft_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # Cannot approve a cancelled draft
    approve_resp = client.post(f"/api/drafts/{draft_id}/approve")
    assert approve_resp.status_code == 400


def test_6_goal_allocation():
    # Check initial goal status
    goals = client.get("/api/goals/1").json()
    exam_goal = next(g for g in goals if g["name"] == "Exam Fee")
    initial_saved = exam_goal["saved_amount"]

    dash_before = client.get("/api/dashboard/1").json()
    bal_before = dash_before["available_balance"]

    # Allocate 1000 to Exam Fee
    alloc_resp = client.post(f"/api/goals/{exam_goal['id']}/allocate", json={
        "user_id": 1,
        "amount": 1000
    })
    assert alloc_resp.status_code == 200
    res_data = alloc_resp.json()
    assert res_data["goal"]["saved_amount"] == initial_saved + 1000
    assert res_data["updated_balance"] == round(bal_before - 1000, 2)


def test_7_insufficient_balance():
    # User balance is less than 50,000
    large_payload = {
        "user_id": 1,
        "corridor_id": 1,
        "amount": 50000,
        "deadline": "2026-11-01"
    }
    response = client.post("/api/drafts", json=large_payload)
    assert response.status_code == 400
    assert "Insufficient available balance" in response.json()["detail"]


def test_8_invalid_allocation():
    goals = client.get("/api/goals/1").json()
    exam_goal = next(g for g in goals if g["name"] == "Exam Fee")

    # Allocation of 0 or negative
    resp_zero = client.post(f"/api/goals/{exam_goal['id']}/allocate", json={
        "user_id": 1,
        "amount": 0
    })
    assert resp_zero.status_code == 422 or resp_zero.status_code == 400

    # Allocation exceeding remaining goal target
    remaining = exam_goal["remaining_amount"]
    resp_excess = client.post(f"/api/goals/{exam_goal['id']}/allocate", json={
        "user_id": 1,
        "amount": remaining + 10000
    })
    assert resp_excess.status_code == 400
    assert "exceeds" in resp_excess.json()["detail"] or "Insufficient" in resp_excess.json()["detail"]


def test_9_reset_demo():
    reset_resp = client.post("/api/demo/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

    # Verify reset values
    dash = client.get("/api/dashboard/1").json()
    assert dash["available_balance"] == 20000.0
    assert dash["simulated_transfers_count"] == 0

    goals = client.get("/api/goals/1").json()
    assert len(goals) == 2
    exam_goal = next(g for g in goals if g["name"] == "Exam Fee")
    assert exam_goal["saved_amount"] == 2000.0
    assert exam_goal["target_amount"] == 5000.0

"""Basic unit tests for GradPath backend."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store import create_user, find_user_by_email, reset_demo_state, seed_persona

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_demo():
    """Reset demo state before each test."""
    reset_demo_state()
    yield


def test_health():
    """Test health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_user():
    """Test user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": "test@example.com", "password": "password123", "program": "MS Data Science"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token"]
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email():
    """Test duplicate email registration fails."""
    client.post(
        "/api/v1/auth/register",
        json={"name": "User 1", "email": "test@example.com", "password": "pass1", "program": "MS CS"},
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "User 2", "email": "test@example.com", "password": "pass2", "program": "MBA"},
    )
    assert response.status_code == 409


def test_login():
    """Test user login."""
    client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "user@example.com", "password": "secret", "program": "MS CS"},
    )
    response = client.post("/api/v1/auth/login", json={"email": "user@example.com", "password": "secret"})
    assert response.status_code == 200
    assert response.json()["token"]


def test_login_invalid_password():
    """Test login with invalid password."""
    client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "user@example.com", "password": "correct", "program": "MS CS"},
    )
    response = client.post("/api/v1/auth/login", json={"email": "user@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_demo_personas():
    """Test demo personas list."""
    response = client.get("/api/v1/demo/personas")
    assert response.status_code == 200
    personas = response.json()
    assert len(personas) == 3
    assert any(p["id"] == "anushka" for p in personas)


def test_activate_persona():
    """Test persona activation."""
    response = client.post("/api/v1/demo/personas/anushka/activate")
    assert response.status_code == 200
    data = response.json()
    assert data["token"]
    assert data["user"]["name"] == "Anushka Sharma"


def test_get_user_profile():
    """Test read user profile."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Profile Test", "email": "profile@test.com", "password": "pass", "program": "MS AI"},
    )
    token = reg_response.json()["token"]
    response = client.get("/api/v1/users/me", headers={"X-Session-Token": token})
    assert response.status_code == 200
    assert response.json()["name"] == "Profile Test"


def test_update_profile():
    """Test update user profile."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "update@test.com", "password": "pass", "program": "MBA"},
    )
    token = reg_response.json()["token"]
    response = client.patch(
        "/api/v1/users/me",
        json={"cgpa": 8.5, "ielts": 7.0, "budget_usd": 50000},
        headers={"X-Session-Token": token},
    )
    assert response.status_code == 200
    assert response.json()["cgpa"] == 8.5


def test_universities_list():
    """Test university list endpoint."""
    response = client.get("/api/v1/universities")
    assert response.status_code == 200
    unis = response.json()
    assert len(unis) > 0
    assert "name" in unis[0]


def test_universities_filter_by_country():
    """Test university filtering by country."""
    response = client.get("/api/v1/universities?country=Canada")
    assert response.status_code == 200
    unis = response.json()
    assert all(u["country"] == "Canada" for u in unis)


def test_universities_search():
    """Test university search."""
    response = client.get("/api/v1/universities?query=Toronto")
    assert response.status_code == 200
    unis = response.json()
    assert any("Toronto" in u["name"] for u in unis)


def test_university_detail():
    """Test university detail endpoint."""
    response = client.get("/api/v1/universities/toronto")
    assert response.status_code == 200
    uni = response.json()
    assert uni["id"] == "toronto"
    assert uni["name"] == "University of Toronto"


def test_shortlist_university():
    """Test shortlist university."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "shortlist@test.com", "password": "pass", "program": "MS CS"},
    )
    token = reg_response.json()["token"]
    response = client.post("/api/v1/universities/toronto/shortlist", headers={"X-Session-Token": token})
    assert response.status_code == 200
    assert "toronto" in response.json()["shortlist"]


def test_remove_shortlist():
    """Test remove from shortlist."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "shortlist2@test.com", "password": "pass", "program": "MS CS"},
    )
    token = reg_response.json()["token"]
    client.post("/api/v1/universities/nus/shortlist", headers={"X-Session-Token": token})
    response = client.delete("/api/v1/universities/nus/shortlist", headers={"X-Session-Token": token})
    assert response.status_code == 200
    assert "nus" not in response.json()["shortlist"]


def test_generate_recommendations():
    """Test recommendation generation."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "rec@test.com", "password": "pass", "program": "MS Computer Science"},
    )
    token = reg_response.json()["token"]
    response = client.post("/api/v1/recommendations/generate", headers={"X-Session-Token": token})
    assert response.status_code == 200
    assert "items" in response.json()
    assert len(response.json()["items"]) > 0


def test_loan_eligibility():
    """Test loan eligibility check."""
    response = client.post("/api/v1/loan/eligibility", json={"requested_amount_usd": 40000, "annual_income_usd": 100000})
    assert response.status_code == 200
    result = response.json()
    assert "eligible" in result or "score" in result


def test_loan_emi_calculation():
    """Test loan EMI calculation."""
    response = client.post(
        "/api/v1/loan/emi",
        json={"principal_usd": 50000, "interest_rate_annual_pct": 8.5, "tenor_years": 10},
    )
    assert response.status_code == 200
    assert "monthly_emi_usd" in response.json()


def test_nudges_list():
    """Test nudges list endpoint."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "nudge@test.com", "password": "pass", "program": "MBA"},
    )
    token = reg_response.json()["token"]
    response = client.get("/api/v1/nudges/me", headers={"X-Session-Token": token})
    assert response.status_code == 200
    assert "items" in response.json()


def test_dashboard():
    """Test student dashboard."""
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test", "email": "dash@test.com", "password": "pass", "program": "MS CS"},
    )
    token = reg_response.json()["token"]
    response = client.get("/api/v1/dashboard/student", headers={"X-Session-Token": token})
    assert response.status_code == 200
    dashboard = response.json()
    assert "stats" in dashboard
    assert "profile" in dashboard


def test_admin_reset_demo():
    """Test admin reset demo endpoint."""
    response = client.post("/api/v1/admin/reset-demo")
    assert response.status_code == 200
    assert response.json()["status"] == "reset"

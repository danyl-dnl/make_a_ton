"""Tests for Authentication, Password Validation, JWT, and Role-Based Access Control."""

import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.session import sync_session_factory
from app.models.customer import Customer
from app.models.user import User
from app.services.auth_service import AuthService


def unique_email(prefix: str = "user") -> str:
    """Generate isolated unique email for testing."""
    return f"{prefix}_{uuid.uuid4().hex[:10]}@brightloop-test.io"


def test_customer_registration_success(client: TestClient):
    """Verify that a new customer can register with valid password and receive 201 Created."""
    email = unique_email("customer")
    payload = {
        "email": email.upper(),  # Test normalization
        "password": "SecurePassword123!",
        "full_name": "Test Customer User",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, f"Expected 201, got: {response.text}"
    data = response.json()

    assert data["email"] == email.lower()
    assert data["full_name"] == "Test Customer User"
    assert data["role"] == "customer"
    assert data["is_active"] is True
    assert "id" in data
    # Ensure sensitive fields are never leaked
    assert "password" not in data
    assert "hashed_password" not in data
    assert "password_hash" not in data


def test_duplicate_email_registration_rejected(client: TestClient):
    """Verify that registering with an already existing email is rejected."""
    email = unique_email("dup")
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Initial User",
    }
    first_res = client.post("/api/auth/register", json=payload)
    assert first_res.status_code == 201

    # Attempt duplicate registration with same email (different case)
    dup_payload = {
        "email": email.upper(),
        "password": "DifferentPassword123!",
        "full_name": "Duplicate User",
    }
    second_res = client.post("/api/auth/register", json=dup_payload)
    assert second_res.status_code in (400, 409)
    assert "already registered" in second_res.text.lower()


def test_password_validation_too_short(client: TestClient):
    """Verify that passwords <= 8 characters are rejected with 422 Unprocessable Entity."""
    email = unique_email("short_pwd")
    payload = {
        "email": email,
        "password": "Ab1!",  # 4 characters
        "full_name": "Short Password User",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert "more than 8 characters" in response.text.lower() or "string_too_short" in response.text


def test_password_validation_eight_characters(client: TestClient):
    """Verify that passwords of exactly 8 characters are rejected (rule: > 8 chars)."""
    email = unique_email("eight_pwd")
    payload = {
        "email": email,
        "password": "Abc1234!",  # exactly 8 characters
        "full_name": "Eight Char User",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert "more than 8 characters" in response.text.lower() or "at least 9" in response.text.lower()


def test_password_validation_missing_uppercase(client: TestClient):
    """Verify that passwords missing an uppercase letter are rejected."""
    email = unique_email("no_upper")
    payload = {
        "email": email,
        "password": "securepassword123!",
        "full_name": "No Upper User",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert "uppercase letter" in response.text.lower()


def test_password_validation_missing_lowercase(client: TestClient):
    """Verify that passwords missing a lowercase letter are rejected."""
    email = unique_email("no_lower")
    payload = {
        "email": email,
        "password": "SECUREPASSWORD123!",
        "full_name": "No Lower User",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert "lowercase letter" in response.text.lower()


def test_password_validation_missing_special_character(client: TestClient):
    """Verify that passwords missing a special character are rejected."""
    email = unique_email("no_special")
    payload = {
        "email": email,
        "password": "SecurePassword1234",
        "full_name": "No Special User",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert "special character" in response.text.lower()


def test_public_registration_cannot_specify_admin_or_staff(client: TestClient):
    """Verify that public registration rejects attempts to register with role 'admin' or 'staff'."""
    # Attempt admin
    email_admin = unique_email("fake_admin")
    res_admin = client.post("/api/auth/register", json={
        "email": email_admin,
        "password": "SecurePassword123!",
        "full_name": "Fake Admin",
        "role": "admin",
    })
    assert res_admin.status_code == 422
    assert "strictly permitted for 'customer' role" in res_admin.text

    # Attempt staff
    email_staff = unique_email("fake_staff")
    res_staff = client.post("/api/auth/register", json={
        "email": email_staff,
        "password": "SecurePassword123!",
        "full_name": "Fake Staff",
        "role": "staff",
    })
    assert res_staff.status_code == 422
    assert "strictly permitted for 'customer' role" in res_staff.text


def test_login_successful(client: TestClient):
    """Verify login with correct credentials returns a valid JWT token and user profile."""
    email = unique_email("login_ok")
    password = "CorrectPassword123!"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Login User",
    })
    assert reg_res.status_code == 201

    login_res = client.post("/api/auth/login", json={
        "email": email.upper(),  # Check login email normalization
        "password": password,
    })
    assert login_res.status_code == 200, f"Expected 200, got: {login_res.text}"
    token_data = login_res.json()

    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == email.lower()
    assert token_data["user"]["role"] == "customer"
    assert "password" not in token_data["user"]
    assert "hashed_password" not in token_data["user"]


def test_login_invalid_password(client: TestClient):
    """Verify login fails with HTTP 401 when given an invalid password."""
    email = unique_email("bad_pwd")
    password = "RealPassword123!"
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "User Bad Pwd",
    })

    response = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword123!",
    })
    assert response.status_code == 401
    assert "invalid email or password" in response.text.lower()


def test_login_unknown_email(client: TestClient):
    """Verify login fails with HTTP 401 when email is unknown."""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent_user_999@brightloop-test.io",
        "password": "Password123!",
    })
    assert response.status_code == 401
    assert "invalid email or password" in response.text.lower()


def test_jwt_token_validation_and_me_endpoint(client: TestClient):
    """Verify that a valid JWT bearer token allows accessing authenticated endpoints."""
    email = unique_email("jwt_valid")
    password = "ValidPassword123!"
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "JWT User",
    })

    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]

    # Access /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == email.lower()
    assert me_data["full_name"] == "JWT User"


def test_jwt_token_expired(client: TestClient):
    """Verify that an expired JWT token returns HTTP 401 Unauthorized."""
    expired_payload = {
        "sub": str(uuid.uuid4()),
        "email": "expired@brightloop-test.io",
        "role": "customer",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=10),
        "iat": datetime.now(timezone.utc) - timedelta(minutes=70),
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert "could not validate credentials" in response.text.lower()


def test_unauthenticated_request_returns_401(client: TestClient):
    """Verify that accessing a protected endpoint without credentials returns HTTP 401."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_admin_only_staff_account_creation(client: TestClient):
    """Verify that only users with role 'admin' can create staff accounts."""
    # 1. Create an admin user directly via synchronous session
    admin_email = unique_email("admin")
    with sync_session_factory() as session:
        admin_user = User(
            email=admin_email,
            hashed_password=hash_password("AdminSecurePassword123!"),
            full_name="System Administrator",
            role="admin",
            is_active=True,
        )
        session.add(admin_user)
        session.commit()

    # Login as admin to get token
    admin_login = client.post("/api/auth/login", json={
        "email": admin_email,
        "password": "AdminSecurePassword123!",
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    # 2. Register a customer user
    customer_email = unique_email("customer_caller")
    client.post("/api/auth/register", json={
        "email": customer_email,
        "password": "CustomerSecurePassword123!",
        "full_name": "Regular Customer",
    })
    customer_login = client.post("/api/auth/login", json={
        "email": customer_email,
        "password": "CustomerSecurePassword123!",
    })
    customer_token = customer_login.json()["access_token"]

    # 3. Customer attempts to create a staff user -> Expect HTTP 403 Forbidden
    staff_candidate_email = unique_email("staff_cand")
    staff_payload = {
        "email": staff_candidate_email,
        "password": "StaffPassword123!",
        "full_name": "Support Staff Member",
    }
    forbidden_res = client.post(
        "/api/auth/staff",
        json=staff_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert forbidden_res.status_code == 403, f"Expected 403, got: {forbidden_res.text}"
    assert "insufficient permissions" in forbidden_res.text.lower()

    # 4. Unauthenticated caller attempts to create staff user -> Expect HTTP 401
    unauth_res = client.post("/api/auth/staff", json=staff_payload)
    assert unauth_res.status_code == 401

    # 5. Admin caller creates staff user -> Expect HTTP 201 Created
    success_res = client.post(
        "/api/auth/staff",
        json=staff_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert success_res.status_code == 201, f"Expected 201, got: {success_res.text}"
    staff_data = success_res.json()
    assert staff_data["email"] == staff_candidate_email.lower()
    assert staff_data["role"] == "staff"
    assert staff_data["is_active"] is True


@pytest.mark.asyncio
async def test_password_reset_token_lifecycle(db_session: AsyncSession):
    """Verify PasswordResetToken generation, secure hashing, and verification."""
    user = User(
        email=unique_email("reset_user"),
        hashed_password=hash_password("InitialPassword123!"),
        full_name="Reset Target User",
        role="customer",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Generate token
    raw_token = await AuthService.create_password_reset_token(db_session, user_id=user.id)
    assert raw_token is not None
    assert len(raw_token) > 20

    # Verify token lookup
    token_record = await AuthService.verify_password_reset_token(db_session, raw_token)
    assert token_record is not None
    assert token_record.user_id == user.id
    assert token_record.is_used is False

    # Mark as used and verify it cannot be reused
    token_record.is_used = True
    await db_session.commit()

    reused = await AuthService.verify_password_reset_token(db_session, raw_token)
    assert reused is None

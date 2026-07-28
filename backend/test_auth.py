"""
Gaia Authentication Module Integration Tests
--------------------------------------------
This script tests the complete authentication and authorization flows in Gaia:
- Public self-registration (forced Villager role, pending approval status).
- Verification checking on login for Villagers.
- Admin login and authentication.
- Admin-only registration of Officers with temporary passwords.
- Forced password change rules on first login for Officers.
- Password change updates.
- Profile access controls.
"""

import sys
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Set up path and imports
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

client = TestClient(app)

def clear_test_users():
    """Cleans up test users from the database before running tests."""
    db = SessionLocal()
    try:
        db.query(User).filter(User.email.in_([
            "test_villager@gaia.com",
            "test_officer@gaia.com",
            "test_admin_public@gaia.com"
        ])).delete(synchronize_session=False)
        # Reset the default admin's verification or state if needed
        admin = db.query(User).filter(User.email == "admin@gaia.com").first()
        if admin:
            admin.is_active = True
            admin.must_change_password = False
        db.commit()
    finally:
        db.close()

def run_tests():
    print("=== Cleaning up test users ===")
    clear_test_users()

    print("\n=== Test 1: Public Self-Registration (Villager) ===")
    # Villager registering through the public endpoint
    register_payload = {
        "full_name": "John Villager",
        "email": "test_villager@gaia.com",
        "phone": "9876543210",
        "password": "VillagerPassword123",
        "role": "Villager"
    }
    # Using local test client to simulate endpoint request
    response = client.post("/auth/register", json=register_payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    user_data = response.json()
    print("Registration Response:", user_data)
    assert user_data["role"] == "Villager"
    assert user_data["is_verified"] is False, "Villager must default to Pending (is_verified = False)"
    print("[PASS]: Villager registered with 'Pending' status.")

    print("\n=== Test 2: Prevent Login if Villager is Pending Approval ===")
    login_payload = {
        "email": "test_villager@gaia.com",
        "password": "VillagerPassword123"
    }
    response = client.post("/auth/login", json=login_payload)
    print("Login Response (Pending Villager):", response.status_code, response.text)
    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
    assert "pending administrator approval" in response.json()["detail"]
    print("[PASS]: Blocked login for pending villager.")

    print("\n=== Test 3: Admin Login ===")
    admin_login = {
        "email": "admin@gaia.com",
        "password": "AdminPassword123"
    }
    response = client.post("/auth/login", json=admin_login)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    admin_token_data = response.json()
    admin_token = admin_token_data["access_token"]
    print("Admin logged in successfully. Token length:", len(admin_token))
    print("[PASS]: Admin authentication succeeded.")

    print("\n=== Test 4: Retrieve Admin Info (/auth/me) ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    print("Me Response:", response.json())
    assert response.json()["email"] == "admin@gaia.com"
    print("[PASS]: Me endpoint retrieved profile details correctly.")

    print("\n=== Test 5: Verify Admin Can Register Officer (Role Setting) ===")
    officer_payload = {
        "full_name": "Officer Jane",
        "email": "test_officer@gaia.com",
        "phone": "9876543211",
        "password": "OfficerTemp123",
        "role": "Officer"
    }
    response = client.post("/auth/register", json=officer_payload, headers=headers)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    officer_data = response.json()
    print("Admin Registered Officer Response:", officer_data)
    assert officer_data["role"] == "Officer"
    assert officer_data["is_verified"] is True, "Admin created users are auto-verified"
    print("[PASS]: Admin successfully registered a verified Officer.")

    print("\n=== Test 6: Verify Public Registration Cannot Set Role to Admin/Officer ===")
    fake_admin_payload = {
        "full_name": "Public Intruder",
        "email": "test_admin_public@gaia.com",
        "phone": "9876543212",
        "password": "FakeAdmin123",
        "role": "Admin" # Attempting to register as Admin
    }
    response = client.post("/auth/register", json=fake_admin_payload)
    assert response.status_code == 201
    intruder_data = response.json()
    print("Public Register (with Admin role requested) Response:", intruder_data)
    assert intruder_data["role"] == "Villager", "Public registrations must be forced to 'Villager'"
    assert intruder_data["is_verified"] is False, "Public registrations must be pending"
    print("[PASS]: Public registration forced role to Villager.")

    print("\n=== Test 7: Officer Login & First-Login Password Change Requirement ===")
    officer_login = {
        "email": "test_officer@gaia.com",
        "password": "OfficerTemp123"
    }
    response = client.post("/auth/login", json=officer_login)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    officer_token_data = response.json()
    officer_token = officer_token_data["access_token"]
    print("Officer logged in. Token length:", len(officer_token))

    # Try calling /auth/me with the officer token (should fail because must change password first)
    officer_headers = {"Authorization": f"Bearer {officer_token}"}
    response = client.get("/auth/me", headers=officer_headers)
    print("Officer calling /auth/me before password change:", response.status_code, response.text)
    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
    assert "Password change required" in response.json()["detail"]
    print("[PASS]: Officer blocked from general endpoints due to force-change flag.")

    print("\n=== Test 8: Officer Changes Password ===")
    change_payload = {
        "old_password": "OfficerTemp123",
        "new_password": "OfficerNewPass123"
    }
    response = client.post("/auth/change-password", json=change_payload, headers=officer_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    print("Password change response:", response.json())
    print("[PASS]: Officer successfully updated password.")

    print("\n=== Test 9: Verify Officer Access Now Permitted ===")
    response = client.get("/auth/me", headers=officer_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    print("Officer /auth/me response after password change:", response.json())
    assert response.json()["email"] == "test_officer@gaia.com"
    print("[PASS]: Officer successfully accessed /auth/me after changing password.")

    print("\n=== All Tests Passed Successfully! ===")

if __name__ == "__main__":
    run_tests()

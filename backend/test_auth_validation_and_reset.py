import pytest
from pydantic import ValidationError
from datetime import datetime, timedelta
from app.schemas.user import (
    UserCreate,
    VillagerRegister,
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordResetConfirm,
    validate_full_name,
    validate_phone_number
)
from app.models.user import User
from app.models.password_reset_code import PasswordResetCode
from app.services.auth_service import (
    request_password_reset,
    verify_password_reset_code,
    complete_password_reset,
    _hash_token
)
from app.core.security import verify_password
from app.database.session import SessionLocal

# ==========================================
# 1. REGISTRATION INPUT VALIDATION TESTS
# ==========================================

def test_full_name_valid_ascii():
    assert validate_full_name("Rajesh Kumar") == "Rajesh Kumar"

def test_full_name_valid_international_accented():
    # Accented/Unicode international alphabetic characters
    assert validate_full_name("José María Gómez") == "José María Gómez"
    assert validate_full_name("Aarav Müller") == "Aarav Müller"

def test_full_name_trims_and_collapses_whitespace():
    assert validate_full_name("  Sunil   Nair  ") == "Sunil Nair"

def test_full_name_rejects_digits():
    with pytest.raises(ValueError, match="alphabetic characters and spaces only"):
        validate_full_name("Rajesh123")

def test_full_name_rejects_symbols_and_punctuation():
    with pytest.raises(ValueError, match="alphabetic characters and spaces only"):
        validate_full_name("Rajesh@Kumar!")

def test_full_name_rejects_empty_or_whitespace():
    with pytest.raises(ValueError, match="cannot be empty"):
        validate_full_name("   ")

def test_phone_valid_10_digits():
    assert validate_phone_number("9876543210") == "9876543210"

def test_phone_valid_with_country_code():
    # Normalizes +91 Indian prefix to 10-digit DB format
    assert validate_phone_number("+919876543210") == "9876543210"

def test_phone_rejects_alphabets_and_symbols():
    with pytest.raises(ValueError):
        validate_phone_number("98765abcd0")
    with pytest.raises(ValueError):
        validate_phone_number("98765-43210")

def test_phone_rejects_invalid_starting_digit():
    # Indian mobile numbers must start with 6, 7, 8, or 9
    with pytest.raises(ValueError, match="must start with 6, 7, 8, or 9"):
        validate_phone_number("1234567890")

def test_phone_rejects_short_or_long():
    with pytest.raises(ValueError):
        validate_phone_number("98765")
    with pytest.raises(ValueError):
        validate_phone_number("987654321000000000")

def test_user_create_schema_valid():
    user = UserCreate(
        full_name="Vineeth S",
        email="Vineeth@Gaia.org",
        phone="+919876500099",
        password="ValidPassword123"
    )
    assert user.full_name == "Vineeth S"
    assert user.email == "vineeth@gaia.org"  # normalized lowercase
    assert user.phone == "9876500099"

def test_user_create_schema_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(
            full_name="Vineeth S",
            email="not-an-email",
            phone="9876500099",
            password="ValidPassword123"
        )

def test_password_reset_confirm_mismatched_passwords():
    with pytest.raises(ValidationError, match="do not match"):
        PasswordResetConfirm(
            email="user@example.com",
            reset_token="some_token_12345",
            new_password="NewPassword123",
            confirm_password="DifferentPassword456"
        )


# ==========================================
# 2. FORGOT PASSWORD WORKFLOW TESTS
# ==========================================

def test_forgot_password_full_workflow():
    db = SessionLocal()
    test_email = "test_pwd_reset@gaia.org"
    original_pwd = "OldSecretPassword123"
    new_pwd = "NewSecurePassword456"

    try:
        # Create a temporary user if not exists
        user = db.query(User).filter(User.email == test_email).first()
        from app.core.security import hash_password
        if not user:
            user = User(
                full_name="Reset Test User",
                email=test_email,
                phone="9988771122",
                password=hash_password(original_pwd),
                role="Villager",
                is_verified=True,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.password = hash_password(original_pwd)
            db.commit()

        # Step 1: Request Password Reset
        req_res = request_password_reset(test_email, db)
        assert "message" in req_res

        # Retrieve the generated code from database
        code_record = db.query(PasswordResetCode).filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.is_used == False
        ).order_by(PasswordResetCode.id.desc()).first()
        assert code_record is not None
        assert code_record.expires_at > datetime.utcnow()

        # Step 2: Verify Incorrect Code Rejected
        with pytest.raises(Exception):
            verify_password_reset_code(test_email, "000000", db)

        # Retrieve current code from DB hash test: brute force 6 digits or test direct
        # In our implementation: code_record.code_hash is SHA256 of code
        # Let's verify by finding the matching code or testing a known hash:
        test_known_code = "654321"
        code_record.code_hash = _hash_token(test_known_code)
        code_record.attempts = 0
        db.commit()

        verify_res = verify_password_reset_code(test_email, test_known_code, db)
        assert "reset_token" in verify_res
        reset_token = verify_res["reset_token"]

        # Step 3: Complete Password Reset with New Password
        comp_res = complete_password_reset(test_email, reset_token, new_pwd, db)
        assert "successfully" in comp_res["message"]

        # Step 4: Verify Old Password Rejected, New Password Accepted
        db.refresh(user)
        assert verify_password(new_pwd, user.password)
        assert not verify_password(original_pwd, user.password)

        # Step 5: Verify Used Token Cannot Be Reused
        with pytest.raises(Exception):
            complete_password_reset(test_email, reset_token, "AnotherPassword789", db)

    finally:
        # Cleanup test records
        db.query(PasswordResetCode).filter(PasswordResetCode.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

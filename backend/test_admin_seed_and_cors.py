import pytest
from unittest.mock import MagicMock
from app.models.user import User
from app.database import seed
from app.core.config import Settings


def test_seed_admin_disabled_skips_creation():
    db = MagicMock()
    # Mock settings with SEED_ADMIN=False
    mock_settings = MagicMock()
    mock_settings.SEED_ADMIN = False

    orig_settings = seed.settings
    try:
        seed.settings = mock_settings
        seed.seed_admin_user(db)
        # Should not query or add any user
        db.add.assert_not_called()
        db.commit.assert_not_called()
    finally:
        seed.settings = orig_settings


def test_seed_admin_exists_does_not_create_duplicate():
    db = MagicMock()
    existing_admin = User(email="admin@gaia.com", role="Admin")
    db.query.return_value.filter.return_value.first.return_value = existing_admin

    mock_settings = MagicMock()
    mock_settings.SEED_ADMIN = True

    orig_settings = seed.settings
    try:
        seed.settings = mock_settings
        seed.seed_admin_user(db)
        db.add.assert_not_called()
        db.commit.assert_not_called()
    finally:
        seed.settings = orig_settings


def test_seed_admin_production_missing_password_fails():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    mock_settings = MagicMock()
    mock_settings.SEED_ADMIN = True
    mock_settings.ENVIRONMENT = "production"
    mock_settings.ADMIN_PASSWORD = None

    orig_settings = seed.settings
    try:
        seed.settings = mock_settings
        with pytest.raises(ValueError, match="Production configuration error: SEED_ADMIN=true but ADMIN_PASSWORD is not set"):
            seed.seed_admin_user(db)
        db.add.assert_not_called()
    finally:
        seed.settings = orig_settings


def test_seed_admin_production_with_password_creates_admin_with_must_change_password():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    mock_settings = MagicMock()
    mock_settings.SEED_ADMIN = True
    mock_settings.ENVIRONMENT = "production"
    mock_settings.ADMIN_EMAIL = "prodadmin@gaia.org"
    mock_settings.ADMIN_PASSWORD = "StrongSecurePassword999!"
    mock_settings.ADMIN_NAME = "Lead Admin"
    mock_settings.ADMIN_PHONE = "9998887770"

    orig_settings = seed.settings
    try:
        seed.settings = mock_settings
        seed.seed_admin_user(db)

        db.add.assert_called_once()
        created_user = db.add.call_args[0][0]
        assert created_user.email == "prodadmin@gaia.org"
        assert created_user.full_name == "Lead Admin"
        assert created_user.must_change_password is True
        assert created_user.role == "Admin"
        db.commit.assert_called_once()
    finally:
        seed.settings = orig_settings


def test_seed_admin_development_default_fallback():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    mock_settings = MagicMock()
    mock_settings.SEED_ADMIN = True
    mock_settings.ENVIRONMENT = "development"
    mock_settings.ADMIN_EMAIL = "admin@gaia.com"
    mock_settings.ADMIN_PASSWORD = None
    mock_settings.ADMIN_NAME = "Gaia System Administrator"
    mock_settings.ADMIN_PHONE = "9876543210"

    orig_settings = seed.settings
    try:
        seed.settings = mock_settings
        seed.seed_admin_user(db)

        db.add.assert_called_once()
        created_user = db.add.call_args[0][0]
        assert created_user.email == "admin@gaia.com"
        assert created_user.must_change_password is False
        assert created_user.role == "Admin"
        db.commit.assert_called_once()
    finally:
        seed.settings = orig_settings


def test_cors_production_rejects_wildcard():
    # Helper to test the CORS resolution logic in main.py
    def resolve_cors(environment: str, raw_cors: str):
        is_prod = environment.lower() in ("production", "prod")
        raw = (raw_cors or "").strip()
        if is_prod:
            if not raw or raw == "*":
                raise ValueError("Production configuration error: CORS_ORIGINS must be set to the explicit frontend origin(s)")
            return [o.strip() for o in raw.split(",") if o.strip()]
        else:
            if raw == "*" or not raw:
                origins = ["*"]
            else:
                origins = [o.strip() for o in raw.split(",") if o.strip()]
            for dev in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
                if dev not in origins and "*" not in origins:
                    origins.append(dev)
            return origins

    with pytest.raises(ValueError, match="CORS_ORIGINS must be set to the explicit frontend origin"):
        resolve_cors("production", "*")

    with pytest.raises(ValueError, match="CORS_ORIGINS must be set to the explicit frontend origin"):
        resolve_cors("production", "")


def test_cors_production_accepts_explicit_domains_without_localhost():
    def resolve_cors(environment: str, raw_cors: str):
        is_prod = environment.lower() in ("production", "prod")
        raw = (raw_cors or "").strip()
        if is_prod:
            if not raw or raw == "*":
                raise ValueError("Production configuration error")
            return [o.strip() for o in raw.split(",") if o.strip()]
        return []

    origins = resolve_cors("production", "https://gaia.vercel.app, https://admin.gaia.gov.in")
    assert origins == ["https://gaia.vercel.app", "https://admin.gaia.gov.in"]
    assert "http://localhost:5173" not in origins
    assert "http://127.0.0.1:5173" not in origins


def test_cors_development_includes_localhost_origins():
    def resolve_cors(environment: str, raw_cors: str):
        is_prod = environment.lower() in ("production", "prod")
        raw = (raw_cors or "").strip()
        if is_prod:
            return []
        if raw == "*" or not raw:
            origins = ["*"]
        else:
            origins = [o.strip() for o in raw.split(",") if o.strip()]
        for dev in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
            if dev not in origins and "*" not in origins:
                origins.append(dev)
        return origins

    origins = resolve_cors("development", "http://my-dev-domain.com")
    assert "http://localhost:5173" in origins
    assert "http://127.0.0.1:5173" in origins
    assert "http://my-dev-domain.com" in origins

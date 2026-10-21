import sys
import os
import io
import pytest

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy.orm import Session
from app.database.database import engine
from app.database.base import Base
import app.models
from app.models.user import User
from app.models.incident import Incident
from app.models.incident_image import IncidentImage
from app.core.security import create_access_token
from app.routers.incidents import _associate_and_validate_images, _extract_image_id, cleanup_orphan_incident_images
from fastapi import HTTPException


@pytest.fixture(scope="module")
def db_session():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    session = Session(engine)
    yield session
    session.close()


def test_incident_image_model_fields(db_session: Session):
    # Test creation and retrieval of IncidentImage
    fake_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRtest"
    image = IncidentImage(
        filename="test_evidence.png",
        content_type="image/png",
        image_bytes=fake_bytes,
        uploader_id=None,
        incident_id=None
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)

    assert image.id is not None
    assert len(image.id) > 10
    assert image.filename == "test_evidence.png"
    assert image.content_type == "image/png"
    assert image.image_bytes == fake_bytes
    assert image.created_at is not None

    # Clean up
    db_session.delete(image)
    db_session.commit()


def test_extract_image_id():
    test_uuid = "12345678-1234-5678-1234-567812345678"
    assert _extract_image_id(f"/api/incidents/images/{test_uuid}") == test_uuid
    assert _extract_image_id(f"/api/incidents/images/{test_uuid}?token=xyz") == test_uuid
    assert _extract_image_id(test_uuid) == test_uuid
    assert _extract_image_id("/static/uploads/incidents/inc_1_abc.jpg") is None
    assert _extract_image_id("") is None


def test_ownership_validation_and_incident_association(db_session: Session):
    # Create two users
    user1 = db_session.query(User).filter(User.role == "Villager").first()
    if not user1:
        user1 = User(
            full_name="Test Villager 1",
            email="test_villager1@example.com",
            phone="9876500001",
            role="Villager",
            hashed_password="hashed_pw_test",
            is_active=True
        )
        db_session.add(user1)
        db_session.commit()
        db_session.refresh(user1)

    user2 = db_session.query(User).filter(User.email == "test_villager2@example.com").first()
    if not user2:
        user2 = User(
            full_name="Test Villager 2",
            email="test_villager2@example.com",
            phone="9876500002",
            role="Villager",
            password="hashed_pw_test",
            is_active=True
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)

    # User 1 uploads an image
    img = IncidentImage(
        filename="user1_evidence.jpg",
        content_type="image/jpeg",
        image_bytes=b"dummybytes1",
        uploader_id=user1.id,
        incident_id=None
    )
    db_session.add(img)
    db_session.commit()
    db_session.refresh(img)

    img_ref = f"/api/incidents/images/{img.id}"

    # Scenario A: User 2 tries to link User 1's image to their own incident -> FORBIDDEN
    mock_inc_user2 = Incident(
        animal_type="Wild Boar",
        animal="Wild Boar",
        severity="Low",
        location="Sector 4",
        latitude=10.0,
        longitude=76.0,
        reported_by=user2.id
    )
    db_session.add(mock_inc_user2)
    db_session.commit()
    db_session.refresh(mock_inc_user2)

    with pytest.raises(HTTPException) as exc_info:
        _associate_and_validate_images([img_ref], mock_inc_user2, user2, db_session)
    assert exc_info.value.status_code == 403

    # Scenario B: User 1 links their own image to their incident -> SUCCESS
    mock_inc_user1 = Incident(
        animal_type="Elephant",
        animal="Elephant",
        severity="High",
        location="Sector 1",
        latitude=10.0,
        longitude=76.0,
        reported_by=user1.id
    )
    db_session.add(mock_inc_user1)
    db_session.commit()
    db_session.refresh(mock_inc_user1)

    _associate_and_validate_images([img_ref], mock_inc_user1, user1, db_session)
    db_session.refresh(img)
    assert img.incident_id == mock_inc_user1.id

    # Scenario C: Trying to re-link an already linked image to another incident -> FORBIDDEN
    with pytest.raises(HTTPException) as exc_info2:
        _associate_and_validate_images([img_ref], mock_inc_user2, user1, db_session)
    assert exc_info2.value.status_code == 403

    # Clean up
    db_session.delete(img)
    db_session.delete(mock_inc_user1)
    db_session.delete(mock_inc_user2)
    db_session.commit()


def test_ai_temp_file_creation_and_cleanup(db_session: Session):
    """
    Test that database-backed incident image bytes can be fetched and written to a temporary
    file for AI analysis, and cleaned up afterwards without polluting repository dirs.
    """
    import tempfile

    fake_img_bytes = b"fake_species_image_content"
    img = IncidentImage(
        filename="test_ai_tiger.jpg",
        content_type="image/jpeg",
        image_bytes=fake_img_bytes,
        uploader_id=None,
        incident_id=None
    )
    db_session.add(img)
    db_session.commit()
    db_session.refresh(img)

    # Emulate the router's retrieval and temp file creation
    ext = os.path.splitext(img.filename)[1] or ".jpg"
    fd, temp_path = tempfile.mkstemp(prefix=f"gaia_ai_{img.id}_", suffix=ext)
    with os.fdopen(fd, "wb") as f:
        f.write(img.image_bytes)

    assert os.path.exists(temp_path)
    with open(temp_path, "rb") as f:
        assert f.read() == fake_img_bytes

    # Ensure cleanup succeeds
    os.remove(temp_path)
    assert not os.path.exists(temp_path)

    # Clean up DB
    db_session.delete(img)
    db_session.commit()


def test_orphan_image_cleanup(db_session: Session):
    """
    Test that cleanup_orphan_incident_images:
    1. Purges images older than 24 hours that are NOT attached to an incident.
    2. Preserves recent images (< 24h old) even if not yet attached.
    3. Preserves images attached to an incident regardless of age.
    """
    from datetime import datetime, timedelta

    # 1. Old unassociated image (>24h old) -> ELIGIBLE
    old_orphan = IncidentImage(
        filename="old_orphan.jpg",
        content_type="image/jpeg",
        image_bytes=b"old_orphan_bytes",
        incident_id=None,
        created_at=datetime.utcnow() - timedelta(hours=36)
    )
    db_session.add(old_orphan)

    # 2. Recent unassociated image (<24h old) -> PRESERVED
    recent_unassociated = IncidentImage(
        filename="recent_upload.jpg",
        content_type="image/jpeg",
        image_bytes=b"recent_bytes",
        incident_id=None,
        created_at=datetime.utcnow() - timedelta(minutes=15)
    )
    db_session.add(recent_unassociated)

    # 3. Old associated image (>24h old, but attached to an incident) -> PRESERVED
    inc = Incident(
        animal_type="Leopard",
        animal="Leopard",
        severity="High",
        location="Sector 2",
        latitude=10.5,
        longitude=76.5
    )
    db_session.add(inc)
    db_session.commit()
    db_session.refresh(inc)

    old_associated = IncidentImage(
        filename="old_associated.jpg",
        content_type="image/jpeg",
        image_bytes=b"associated_bytes",
        incident_id=inc.id,
        created_at=datetime.utcnow() - timedelta(hours=48)
    )
    db_session.add(old_associated)
    db_session.commit()

    old_orphan_id = old_orphan.id
    recent_id = recent_unassociated.id
    associated_id = old_associated.id

    # Run cleanup with 24-hour threshold
    deleted_count = cleanup_orphan_incident_images(db_session, max_age_hours=24)
    assert deleted_count >= 1

    # Verify database state
    assert db_session.query(IncidentImage).filter(IncidentImage.id == old_orphan_id).first() is None
    assert db_session.query(IncidentImage).filter(IncidentImage.id == recent_id).first() is not None
    assert db_session.query(IncidentImage).filter(IncidentImage.id == associated_id).first() is not None

    # Clean up test records
    db_session.delete(recent_unassociated)
    db_session.delete(old_associated)
    db_session.delete(inc)
    db_session.commit()

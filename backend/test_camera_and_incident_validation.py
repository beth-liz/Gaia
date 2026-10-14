import pytest
from pydantic import ValidationError
from app.schemas.camera import CameraCreate, CameraOut
from app.schemas.incident import IncidentCreate

def test_camera_create_valid():
    cam = CameraCreate(
        camera_name="Sector 4 Observation",
        camera_code="CAM-SEC4-01",
        monitoring_station_id=1,
        location_name="Sector 4 Waterhole",
        latitude=11.6667,
        longitude=76.3667,
        status="Active"
    )
    assert cam.camera_name == "Sector 4 Observation"
    assert cam.camera_code == "CAM-SEC4-01"
    assert cam.latitude == 11.6667
    assert cam.longitude == 76.3667

def test_camera_create_invalid_coordinates():
    with pytest.raises(ValidationError):
        CameraCreate(
            camera_name="Invalid Lat",
            camera_code="CAM-INV-01",
            monitoring_station_id=1,
            latitude=95.0,  # invalid: > 90
            longitude=76.0
        )

    with pytest.raises(ValidationError):
        CameraCreate(
            camera_name="Invalid Long",
            camera_code="CAM-INV-02",
            monitoring_station_id=1,
            latitude=11.0,
            longitude=185.0  # invalid: > 180
        )

def test_camera_create_empty_code():
    with pytest.raises(ValidationError):
        CameraCreate(
            camera_name="Empty Code Cam",
            camera_code="   ",
            monitoring_station_id=1,
            latitude=11.0,
            longitude=76.0
        )

def test_incident_create_strict_validation():
    # Valid incident with mandatory image and location
    inc = IncidentCreate(
        animal_type="Tiger",
        latitude=11.6667,
        longitude=76.3667,
        location="Muthanga Sector",
        images=["/static/uploads/incidents/tiger1.jpg"]
    )
    assert inc.animal_type == "Tiger"
    assert inc.location == "Muthanga Sector"
    assert len(inc.images) == 1

def test_incident_create_missing_images():
    with pytest.raises(ValidationError):
        IncidentCreate(
            animal_type="Tiger",
            latitude=11.6667,
            longitude=76.3667,
            location="Muthanga Sector",
            images=[]  # empty: must be rejected
        )

def test_incident_create_missing_location():
    with pytest.raises(ValidationError):
        IncidentCreate(
            animal_type="Tiger",
            latitude=11.6667,
            longitude=76.3667,
            location="   ",  # blank: must be rejected
            images=["/static/uploads/incidents/tiger1.jpg"]
        )

def test_incident_create_invalid_coordinates():
    with pytest.raises(ValidationError):
        IncidentCreate(
            animal_type="Tiger",
            latitude=105.0,  # invalid lat
            longitude=76.3667,
            location="Muthanga Sector",
            images=["/static/uploads/incidents/tiger1.jpg"]
        )

def test_incident_description_is_optional():
    # Description should be allowed to be None or empty
    inc = IncidentCreate(
        animal_type="Elephant",
        latitude=11.6667,
        longitude=76.3667,
        location="Begur Road",
        images=["/static/uploads/incidents/elephant1.jpg"],
        description=None
    )
    assert inc.description is None

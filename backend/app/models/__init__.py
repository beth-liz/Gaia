from app.database.base import Base
from app.database.database import engine

from app.models.state import State
from app.models.district import District
from app.models.monitoring_station import MonitoringStation
from app.models.designation import Designation
from app.models.village import Village
from app.models.user import User
from app.models.animal_species import AnimalSpecies
from app.models.animal_detection import AnimalDetection
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.notification import Notification
from app.models.officer_posting_history import OfficerPostingHistory
from app.models.incident_activity import IncidentActivity
from app.models.field_operation import FieldOperation
from app.models.inventory import (
    InventoryMaster,
    StationInventory,
    InventoryTransaction,
    EquipmentRequest,
    EquipmentAssignment
)
from app.models.camera import Camera
from app.models.camera_capture import CameraCapture
from app.models.camera_capture_result import CameraCaptureAIResult
from app.models.camera_detection_event import CameraDetectionEvent
from app.models.password_reset_code import PasswordResetCode
from app.models.incident_image import IncidentImage

Base.metadata.create_all(bind=engine)

from app.database.base import Base
from app.database.session import engine

from app.models.user import User
from app.models.village import Village
from app.models.monitoring_station import MonitoringStation
from app.models.incident import Incident
from app.models.animal_detection import AnimalDetection
from app.models.alert import Alert
from app.models.officer_assignment import OfficerAssignment
from app.models.activity_log import ActivityLog

Base.metadata.create_all(bind=engine)
from app.database.base import Base
from app.database.database import engine

from app.models.state import State
from app.models.district import District
from app.models.monitoring_station import MonitoringStation
from app.models.designation import Designation
from app.models.village import Village
from app.models.user import User
from app.models.animal_species import AnimalSpecies
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.notification import Notification
from app.models.officer_posting_history import OfficerPostingHistory
from app.models.incident_activity import IncidentActivity
from app.models.field_operation import FieldOperation

Base.metadata.create_all(bind=engine)
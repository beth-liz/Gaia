from app.database.base import Base
from app.database.database import engine

from app.models.designation import Designation
from app.models.village import Village
from app.models.user import User
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.notification import Notification

Base.metadata.create_all(bind=engine)
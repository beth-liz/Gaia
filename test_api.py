import sys
import os
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath('backend'))
load_dotenv(os.path.abspath('backend/.env'))

from sqlalchemy.orm import Session
from app.database.database import engine
from app.services.inventory_service import approve_or_reject_equipment_request
from app.schemas.inventory import EquipmentRequestAction
from app.models.user import User
import traceback

db = Session(engine)
try:
    rfo = db.query(User).filter(User.role == 'Range Forest Officer').first()
    if not rfo:
        print("No RFO found")
        sys.exit(1)
        
    data = EquipmentRequestAction(action='APPROVED')
    
    # Try to approve request #1
    result = approve_or_reject_equipment_request(1, data, rfo, db)
    print("SUCCESS:", result)
except Exception as e:
    print("FAILED WITH EXCEPTION:")
    traceback.print_exc()
finally:
    db.close()

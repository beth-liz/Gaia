import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import engine
from app.database.base import Base
import app.models

def run_migration():
    print("Beginning Field Operation Workflow Migration...")
    Base.metadata.create_all(bind=engine)
    print("Field Operation Workflow Migration completed successfully!")

if __name__ == "__main__":
    run_migration()

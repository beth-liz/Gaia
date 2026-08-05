from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def migrate():
    print("Creating any missing database tables...")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        print("Ensuring columns exist on inventory_master & inventory_transactions...")
        conn.execute(text("""
            ALTER TABLE inventory_master
            ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES inventory_categories(id) ON DELETE RESTRICT,
            ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 5 NOT NULL;
        """))

        conn.execute(text("""
            ALTER TABLE inventory_transactions
            ADD COLUMN IF NOT EXISTS supplier VARCHAR(100);
        """))

        conn.execute(text("""
            ALTER TABLE station_inventory
            ALTER COLUMN status SET DEFAULT 'Available';
        """))
        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()

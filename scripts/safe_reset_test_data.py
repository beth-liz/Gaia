import os
import psycopg2
from dotenv import load_dotenv

def safe_reset_test_data():
    dotenv_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    load_dotenv(dotenv_path)

    pg_user = os.getenv("POSTGRES_USER", "postgres")
    pg_password = os.getenv("POSTGRES_PASSWORD", "Maria1234")
    pg_server = os.getenv("POSTGRES_SERVER", "localhost")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    pg_db = os.getenv("POSTGRES_DB", "gaia")

    print(f"Connecting to {pg_server}:{pg_port}/{pg_db} as {pg_user}...")
    conn = psycopg2.connect(
        dbname=pg_db,
        user=pg_user,
        password=pg_password,
        host=pg_server,
        port=pg_port
    )
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # Pre-check counts
        tables_to_clear = [
            "animal_detections",
            "field_operations",
            "incident_activities",
            "incident_assignments",
            "incidents",
            "camera_detection_events",
            "camera_capture_ai_results",
            "camera_captures",
        ]

        master_tables = [
            "users",
            "cameras",
            "monitoring_stations",
            "villages",
            "districts",
            "states",
            "inventory_master",
            "station_inventory",
            "animal_species",
            "designations"
        ]

        print("\n--- PRE-RESET COUNTS ---")
        for t in tables_to_clear:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            print(f"  [CLEAR TARGET] {t}: {cur.fetchone()[0]}")

        pre_master_counts = {}
        for t in master_tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {t}")
                cnt = cur.fetchone()[0]
                pre_master_counts[t] = cnt
                print(f"  [MASTER DATA]  {t}: {cnt}")
            except Exception as e:
                print(f"  [MASTER DATA]  {t}: (skipped/not found: {e})")
                conn.rollback()
                cur = conn.cursor()

        print("\nDisassociating incident references from equipment_requests...")
        cur.execute("UPDATE equipment_requests SET incident_id = NULL WHERE incident_id IS NOT NULL")
        print(f"  Updated equipment_requests rows.")

        print("Nullifying incident references to camera_detection_events...")
        cur.execute("UPDATE incidents SET camera_detection_event_id = NULL WHERE camera_detection_event_id IS NOT NULL")

        print("Deleting records in child-to-parent order...")
        for t in tables_to_clear:
            cur.execute(f"DELETE FROM {t}")
            print(f"  Deleted all rows from {t}")

        # Reset sequences
        sequences_to_reset = [
            "public.incidents_id_seq",
            "public.camera_captures_id_seq",
            "public.camera_detection_events_id_seq",
            "public.camera_capture_ai_results_id_seq",
            "public.animal_detections_id_seq",
            "public.incident_assignments_id_seq",
            "public.incident_activities_id_seq",
            "public.field_operations_id_seq"
        ]

        print("\nResetting ID sequences to 1...")
        for seq in sequences_to_reset:
            try:
                cur.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")
                print(f"  Reset {seq} -> 1")
            except Exception as e:
                print(f"  Warning resetting {seq}: {e}")

        conn.commit()
        print("\n--- TRANSACTION COMMITTED SUCCESSFULLY ---")

        print("\n--- POST-RESET VERIFICATION ---")
        all_cleared = True
        for t in tables_to_clear:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cur.fetchone()[0]
            print(f"  [CLEARED] {t}: {cnt}")
            if cnt != 0:
                all_cleared = False

        master_intact = True
        for t, expected in pre_master_counts.items():
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cur.fetchone()[0]
            print(f"  [MASTER]  {t}: {cnt} (Expected: {expected})")
            if cnt != expected:
                master_intact = False

        if all_cleared and master_intact:
            print("\nSUCCESS: All test data cleared and all master data verified intact!")
        else:
            print("\nWARNING: Verification check found discrepancies.")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR OCCURRED, TRANSACTION ROLLED BACK: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    safe_reset_test_data()

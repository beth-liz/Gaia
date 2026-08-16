from pathlib import Path
from ultralytics import YOLO

# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

IMAGE_DIR = BASE_DIR / "evaluation" / "elephant"
MODEL_PATH = BASE_DIR / "models" / "yolo11s.pt"
OUTPUT_DIR = BASE_DIR / "results" / "elephant_detection_yolo11s"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

print("Loading YOLO11s...")

model = YOLO(str(MODEL_PATH))

# --------------------------------------------------
# DETECT
# --------------------------------------------------

print()
print("=" * 70)
print("YOLO11s ELEPHANT DETECTION")
print("=" * 70)
print()

image_files = sorted(IMAGE_DIR.glob("*.jpg"))

print(f"Found {len(image_files)} images.")
print()

for image_path in image_files:

    print(f"Processing: {image_path.name}")

    model.predict(
        source=str(image_path),
        conf=0.25,
        save=True,
        project=str(OUTPUT_DIR),
        name="detections",
        exist_ok=True,
        verbose=False
    )

print()
print("=" * 70)
print("YOLO11s DETECTION COMPLETED")
print("=" * 70)

print()
print(f"Results saved to:")
print(OUTPUT_DIR / "detections")

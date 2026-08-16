import csv
from pathlib import Path
from ultralytics import YOLO

# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

IMAGE_DIR = BASE_DIR / "evaluation" / "elephant"
MODEL_PATH = BASE_DIR / "models" / "yolo11s.pt"

OUTPUT_DIR = BASE_DIR / "results" / "elephant_evaluation_yolo11s"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REPORT_FILE = OUTPUT_DIR / "detection_count_report.csv"

# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

print("Loading YOLO11s...")

model = YOLO(str(MODEL_PATH))

# --------------------------------------------------
# RUN DETECTION WITHOUT SAVING IMAGES
# --------------------------------------------------

image_files = sorted(IMAGE_DIR.glob("*.jpg"))

results = []

print()
print("=" * 70)
print("YOLO11s ELEPHANT COUNT EVALUATION")
print("=" * 70)
print()

for image_path in image_files:

    prediction = model(
        str(image_path),
        conf=0.25,
        verbose=False
    )[0]

    predicted = 0
    confidences = []

    for cls, conf in zip(
        prediction.boxes.cls.tolist(),
        prediction.boxes.conf.tolist()
    ):

        class_name = model.names[int(cls)]

        if class_name.lower() == "elephant":
            predicted += 1
            confidences.append(float(conf))

    average_confidence = (
        sum(confidences) / len(confidences)
        if confidences
        else 0
    )

    results.append({
        "image": image_path.name,
        "predicted_elephants": predicted,
        "average_confidence": round(average_confidence, 4)
    })

    print(
        f"{image_path.name:<18}"
        f"Elephants detected: {predicted:<3}"
        f"Average confidence: {average_confidence:.2%}"
    )

# --------------------------------------------------
# SAVE CSV
# --------------------------------------------------

with open(REPORT_FILE, "w", newline="", encoding="utf-8") as file:

    fieldnames = [
        "image",
        "predicted_elephants",
        "average_confidence"
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(results)

# --------------------------------------------------
# SUMMARY
# --------------------------------------------------

total_detected = sum(
    r["predicted_elephants"]
    for r in results
)

print()
print("=" * 70)
print("SUMMARY")
print("=" * 70)

print(f"Images evaluated       : {len(results)}")
print(f"Total elephants detected: {total_detected}")

print()
print("No detection images were saved.")
print("Existing detection images were NOT modified.")

print()
print("Report saved to:")
print(REPORT_FILE)

print("=" * 70)
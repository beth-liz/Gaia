import csv
from pathlib import Path
from ultralytics import YOLO

# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

IMAGE_DIR = BASE_DIR / "evaluation" / "elephant"
GROUND_TRUTH_FILE = BASE_DIR / "evaluation" / "elephant_ground_truth.csv"

MODEL_PATH = BASE_DIR / "models" / "yolo11s.pt"

OUTPUT_DIR = BASE_DIR / "results" / "elephant_evaluation_yolo11s"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REPORT_FILE = OUTPUT_DIR / "comparison_report.csv"


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

print("Loading YOLO model...")

model = YOLO(str(MODEL_PATH))


# --------------------------------------------------
# LOAD GROUND TRUTH
# --------------------------------------------------

ground_truth = {}

with open(GROUND_TRUTH_FILE, "r", encoding="utf-8") as file:
    reader = csv.DictReader(file)

    for row in reader:
        ground_truth[row["image"]] = {
            "actual": int(row["actual_elephants"]),
            "notes": row["notes"]
        }


# --------------------------------------------------
# RUN DETECTION
# --------------------------------------------------

results = []

print()
print("=" * 70)
print("ELEPHANT MODEL EVALUATION")
print("=" * 70)
print()

for image_name, data in ground_truth.items():

    image_path = IMAGE_DIR / image_name

    if not image_path.exists():
        print(f"WARNING: Missing image: {image_name}")
        continue

    actual = data["actual"]

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

    difference = predicted - actual

    if difference == 0:
        result = "Correct count"
    elif difference < 0:
        result = "Missed elephants"
    else:
        result = "False detections"

    if confidences:
        average_confidence = sum(confidences) / len(confidences)
    else:
        average_confidence = 0

    results.append({
        "image": image_name,
        "actual": actual,
        "predicted": predicted,
        "difference": difference,
        "average_confidence": round(average_confidence, 4),
        "result": result,
        "notes": data["notes"]
    })

    print(
        f"{image_name:<18}"
        f"Actual: {actual:<3}"
        f"Predicted: {predicted:<3}"
        f"Difference: {difference:+3}"
        f"  {result}"
    )


# --------------------------------------------------
# SAVE CSV REPORT
# --------------------------------------------------

with open(REPORT_FILE, "w", newline="", encoding="utf-8") as file:

    fieldnames = [
        "image",
        "actual",
        "predicted",
        "difference",
        "average_confidence",
        "result",
        "notes"
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)

    writer.writeheader()
    writer.writerows(results)


# --------------------------------------------------
# SUMMARY
# --------------------------------------------------

total_images = len(results)

correct = sum(
    1 for r in results
    if r["actual"] == r["predicted"]
)

missed = sum(
    1 for r in results
    if r["predicted"] < r["actual"]
)

false_detections = sum(
    1 for r in results
    if r["predicted"] > r["actual"]
)

count_accuracy = (correct / total_images) * 100 if total_images else 0

total_actual = sum(r["actual"] for r in results)
total_predicted = sum(r["predicted"] for r in results)


print()
print("=" * 70)
print("SUMMARY")
print("=" * 70)

print(f"Total images       : {total_images}")
print(f"Correct count      : {correct}")
print(f"Missed detections  : {missed}")
print(f"False detections   : {false_detections}")

print(f"Count accuracy     : {count_accuracy:.2f}%")

print()
print(f"Actual elephants   : {total_actual}")
print(f"Detected elephants : {total_predicted}")

print()
print(f"Report saved to:")
print(REPORT_FILE)

print("=" * 70)
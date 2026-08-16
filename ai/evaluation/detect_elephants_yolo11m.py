from pathlib import Path
from ultralytics import YOLO

# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

IMAGE_DIR = BASE_DIR / "evaluation" / "elephant"

MODEL_PATH = BASE_DIR / "models" / "yolo11m.pt"

OUTPUT_DIR = BASE_DIR / "results" / "elephant_detection_yolo11m"
DETECTION_DIR = OUTPUT_DIR / "detections"

DETECTION_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD MODEL
# ============================================================

print()
print("=" * 70)
print("LOADING YOLO11m MODEL")
print("=" * 70)

model = YOLO(str(MODEL_PATH))

print("Model loaded successfully.")
print(f"Model: {MODEL_PATH}")


# ============================================================
# FIND IMAGES
# ============================================================

image_files = sorted(IMAGE_DIR.glob("*.jpg"))

print()
print(f"Found {len(image_files)} images.")
print()


# ============================================================
# DETECTION
# ============================================================

print("=" * 70)
print("YOLO11m ELEPHANT DETECTION")
print("=" * 70)
print()


for image_path in image_files:

    print("-" * 70)
    print(f"Processing: {image_path.name}")

    # Run YOLO detection
    result = model(
        str(image_path),
        conf=0.25,
        verbose=False
    )[0]

    # --------------------------------------------------------
    # COUNT ELEPHANTS
    # --------------------------------------------------------

    elephant_count = 0
    elephant_confidences = []

    for cls, conf in zip(
        result.boxes.cls.tolist(),
        result.boxes.conf.tolist()
    ):

        class_name = model.names[int(cls)]

        if class_name.lower() == "elephant":
            elephant_count += 1
            elephant_confidences.append(float(conf))

    # --------------------------------------------------------
    # SAVE ANNOTATED IMAGE
    # --------------------------------------------------------

    output_path = DETECTION_DIR / image_path.name

    annotated_image = result.plot()

    import cv2

    cv2.imwrite(
        str(output_path),
        annotated_image
    )

    # --------------------------------------------------------
    # CALCULATE AVERAGE CONFIDENCE
    # --------------------------------------------------------

    if elephant_confidences:
        average_confidence = (
            sum(elephant_confidences)
            / len(elephant_confidences)
        )
    else:
        average_confidence = 0

    # --------------------------------------------------------
    # TERMINAL OUTPUT
    # --------------------------------------------------------

    print()
    print(f"Elephants detected : {elephant_count}")
    print(f"Average confidence : {average_confidence:.3f}")

    print()
    print("Detection image saved:")
    print(output_path)

    print()


# ============================================================
# COMPLETED
# ============================================================

print()
print("=" * 70)
print("YOLO11m DETECTION COMPLETED")
print("=" * 70)

print()
print(f"Total images processed : {len(image_files)}")

print()
print("All detection images saved in:")
print(DETECTION_DIR)

print()
print("=" * 70)
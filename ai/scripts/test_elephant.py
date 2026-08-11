from ultralytics import YOLO
from pathlib import Path

# Load a pretrained YOLO model
model = YOLO("yolo11n.pt")

# Path to the elephant image
image_path = Path("../test_images/elephant.jpg")

# Run detection
results = model.predict(
    source=str(image_path),
    conf=0.25,
    save=True
)

# Display detected objects
for result in results:
    print("\nDetected objects:")

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])

        class_name = result.names[class_id]

        print(
            f"- {class_name}: "
            f"{confidence * 100:.2f}% confidence"
        )
from ultralytics import YOLO
from pathlib import Path
import time

# Load the pretrained YOLO model
model = YOLO("scripts/yolo11n.pt")

# Folder containing the 20 elephant images
image_folder = Path("evaluation")

# Folder where detection results will be saved
output_folder = Path("results/elephant_evaluation")
output_folder.mkdir(parents=True, exist_ok=True)

# Find all supported image files
images = []

for extension in ["*.jpg", "*.jpeg", "*.png"]:
    images.extend(image_folder.glob(extension))

print(f"\nFound {len(images)} images.\n")

if len(images) == 0:
    print("ERROR: No images found in the evaluation folder.")
    print("Make sure your elephant images are inside:")
    print(image_folder.resolve())
    exit()

# Process every image
for image_path in sorted(images):

    start_time = time.perf_counter()

    results = model.predict(
        source=str(image_path),
        conf=0.25,
        save=True,
        project=str(output_folder),
        name="detections",
        exist_ok=True,
        verbose=False
    )

    end_time = time.perf_counter()

    inference_time = (end_time - start_time) * 1000

    elephant_count = 0

    for result in results:

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = result.names[class_id]

            if class_name == "elephant":
                elephant_count += 1

                print(
                    f"{image_path.name} -> "
                    f"elephant: {confidence * 100:.2f}%"
                )

    print(
        f"{image_path.name} -> "
        f"{elephant_count} elephant(s) detected | "
        f"{inference_time:.2f} ms"
    )

print("\n===================================")
print("Elephant evaluation completed.")
print("===================================")
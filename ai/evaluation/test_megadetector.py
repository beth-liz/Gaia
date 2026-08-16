from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from PytorchWildlife.models import detection as pw_detection


# ============================================================
# GAIA - MEGADETECTOR TEST
# ============================================================

INPUT_DIR = Path("speciesnet_test/images")
OUTPUT_DIR = Path("speciesnet_test/megadetector_test")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# SETTINGS
# ============================================================

# Detection confidence threshold
CONFIDENCE_THRESHOLD = 0.20


# ============================================================
# LOAD MEGADETECTOR V6
# ============================================================

print("=" * 80)
print("GAIA - MEGADETECTOR TEST")
print("=" * 80)

print("\nLoading MegaDetector V6...")

model = pw_detection.MegaDetectorV6(
    version="MDV6-yolov10-c"
)

print("MegaDetector loaded.\n")


# ============================================================
# FIND IMAGES
# ============================================================

image_files = []

for ext in [
    "*.jpg",
    "*.jpeg",
    "*.JPG",
    "*.JPEG",
    "*.png",
    "*.PNG"
]:
    image_files.extend(INPUT_DIR.rglob(ext))

image_files = sorted(image_files)

print(f"Images found: {len(image_files)}")
print()


# ============================================================
# PROCESS IMAGES
# ============================================================

total_images = 0
total_animals = 0
total_people = 0
total_vehicles = 0


for image_path in image_files:

    try:

        # ----------------------------------------------------
        # RUN MEGADETECTOR
        # ----------------------------------------------------

        result = model.single_image_detection(
            str(image_path)
        )


        # ----------------------------------------------------
        # LOAD ORIGINAL IMAGE
        # ----------------------------------------------------

        image = Image.open(image_path).convert("RGB")

        draw = ImageDraw.Draw(image)


        # ----------------------------------------------------
        # GET DETECTIONS
        # ----------------------------------------------------

        detections = result["detections"]

        boxes = detections.xyxy
        confidences = detections.confidence
        class_ids = detections.class_id


        # ----------------------------------------------------
        # SAFELY CONVERT DETECTIONS TO NUMPY
        # ----------------------------------------------------
        #
        # MegaDetector may return either:
        #
        #   PyTorch tensors
        #
        # or
        #
        #   NumPy arrays
        #
        # Therefore we check whether .cpu() exists
        # before using it.
        # ----------------------------------------------------

        if hasattr(boxes, "cpu"):
            boxes = boxes.cpu().numpy()
        else:
            boxes = np.asarray(boxes)

        if hasattr(confidences, "cpu"):
            confidences = confidences.cpu().numpy()
        else:
            confidences = np.asarray(confidences)

        if hasattr(class_ids, "cpu"):
            class_ids = class_ids.cpu().numpy()
        else:
            class_ids = np.asarray(class_ids)


        # ----------------------------------------------------
        # INITIALIZE IMAGE COUNTERS
        # ----------------------------------------------------

        image_animals = 0
        image_people = 0
        image_vehicles = 0


        # ----------------------------------------------------
        # DRAW DETECTIONS
        # ----------------------------------------------------

        for box, confidence, class_id in zip(
            boxes,
            confidences,
            class_ids
        ):

            confidence = float(confidence)

            # ------------------------------------------------
            # CONFIDENCE FILTER
            # ------------------------------------------------

            if confidence < CONFIDENCE_THRESHOLD:
                continue


            # ------------------------------------------------
            # BOUNDING BOX
            # ------------------------------------------------

            x1, y1, x2, y2 = map(
                int,
                box
            )


            # ------------------------------------------------
            # MEGADETECTOR CATEGORIES
            #
            # 0 = animal
            # 1 = person
            # 2 = vehicle
            # ------------------------------------------------

            class_id = int(class_id)


            if class_id == 0:

                label = f"ANIMAL {confidence:.1%}"

                image_animals += 1
                total_animals += 1


            elif class_id == 1:

                label = f"PERSON {confidence:.1%}"

                image_people += 1
                total_people += 1


            elif class_id == 2:

                label = f"VEHICLE {confidence:.1%}"

                image_vehicles += 1
                total_vehicles += 1


            else:

                label = f"OTHER {confidence:.1%}"


            # ------------------------------------------------
            # DRAW BOUNDING BOX
            # ------------------------------------------------

            draw.rectangle(
                [x1, y1, x2, y2],
                outline="red",
                width=4
            )


            # ------------------------------------------------
            # CALCULATE LABEL SIZE
            # ------------------------------------------------

            text_bbox = draw.textbbox(
                (x1, y1),
                label
            )

            text_width = (
                text_bbox[2] -
                text_bbox[0]
            )

            text_height = (
                text_bbox[3] -
                text_bbox[1]
            )


            # ------------------------------------------------
            # DRAW LABEL BACKGROUND
            # ------------------------------------------------

            draw.rectangle(
                [
                    x1,
                    max(
                        0,
                        y1 - text_height - 6
                    ),
                    x1 + text_width + 8,
                    y1
                ],
                fill="red"
            )


            # ------------------------------------------------
            # DRAW LABEL TEXT
            # ------------------------------------------------

            draw.text(
                (
                    x1 + 4,
                    max(
                        0,
                        y1 - text_height - 4
                    )
                ),
                label,
                fill="white"
            )


        # ====================================================
        # SAVE OUTPUT IMAGE
        # ====================================================

        relative_path = image_path.relative_to(
            INPUT_DIR
        )

        output_path = (
            OUTPUT_DIR /
            relative_path
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        image.save(output_path)


        # ----------------------------------------------------
        # UPDATE TOTAL IMAGE COUNT
        # ----------------------------------------------------

        total_images += 1


        # ----------------------------------------------------
        # PRINT RESULT
        # ----------------------------------------------------

        print(
            f"{image_path.name:<30} "
            f"Animals={image_animals:<3} "
            f"People={image_people:<3} "
            f"Vehicles={image_vehicles:<3}"
        )


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        print(
            f"ERROR processing {image_path}: {e}"
        )


# ============================================================
# SUMMARY
# ============================================================

print()

print("=" * 80)
print("MEGADETECTOR TEST COMPLETE")
print("=" * 80)

print(
    f"Images processed : {total_images}"
)

print(
    f"Animal detections: {total_animals}"
)

print(
    f"People detections: {total_people}"
)

print(
    f"Vehicle detections: {total_vehicles}"
)

print()

print("Output folder:")

print(OUTPUT_DIR)

print()

print("Open with:")

print(
    f'explorer "{OUTPUT_DIR}"'
)
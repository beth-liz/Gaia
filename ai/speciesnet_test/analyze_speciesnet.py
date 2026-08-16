import json
import csv
from pathlib import Path
from collections import Counter

from PIL import Image, ImageDraw, ImageFont


# ============================================================
# GAIA - SPECIESNET RESULT ANALYZER
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

RESULTS_DIR = BASE_DIR / "speciesnet_results"
RESULTS_JSON = RESULTS_DIR / "results.json"

IMAGE_DIR = BASE_DIR / "images"

ANNOTATED_DIR = RESULTS_DIR / "annotated"

CSV_OUTPUT = RESULTS_DIR / "species_summary.csv"
TXT_OUTPUT = RESULTS_DIR / "species_summary.txt"


# ------------------------------------------------------------
# SETTINGS
# ------------------------------------------------------------

# Ignore very weak MegaDetector detections.
DETECTION_THRESHOLD = 0.20

# Ignore weak SpeciesNet classifications.
SPECIES_THRESHOLD = 0.50


# ------------------------------------------------------------
# START
# ------------------------------------------------------------

print("=" * 80)
print("GAIA - SPECIESNET RESULT ANALYZER")
print("=" * 80)

print("\nReading existing results.json...")
print(RESULTS_JSON)

if not RESULTS_JSON.exists():
    print("\nERROR: results.json was not found.")
    print(f"Expected: {RESULTS_JSON}")
    raise SystemExit(1)


# ------------------------------------------------------------
# LOAD JSON
# ------------------------------------------------------------

with open(RESULTS_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)


print(f"\nJSON type: {type(data).__name__}")
print("Top-level keys:")

for key in data.keys():
    print(f"  - {key}")


images = data.get("images", [])

print(f"\nImages in results: {len(images)}")


# ------------------------------------------------------------
# SPECIES CATEGORY MAPPING
# ------------------------------------------------------------

classification_categories = data.get(
    "classification_categories",
    {}
)


def get_species_name(category_id):
    """
    Convert SpeciesNet classification ID
    into the actual species name.
    """

    category_id = str(category_id)

    value = classification_categories.get(category_id)

    if value is None:
        return f"Unknown ({category_id})"

    # Usually the value is a species name.
    if isinstance(value, str):
        return value

    # Handle possible dictionary structures.
    if isinstance(value, dict):

        for key in [
            "name",
            "scientific_name",
            "common_name",
            "label"
        ]:
            if key in value:
                return str(value[key])

    return str(value)


# ------------------------------------------------------------
# OUTPUT DIRECTORIES
# ------------------------------------------------------------

ANNOTATED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ------------------------------------------------------------
# SUMMARY DATA
# ------------------------------------------------------------

csv_rows = []

overall_species = Counter()

total_images = 0
total_animals = 0


# ------------------------------------------------------------
# PROCESS IMAGES
# ------------------------------------------------------------

for image_data in images:

    relative_file = image_data.get("file", "")

    detections = image_data.get(
        "detections",
        []
    )

    image_path = IMAGE_DIR / relative_file

    if not image_path.exists():

        print(
            f"\nWARNING: Image not found: "
            f"{image_path}"
        )

        continue


    # --------------------------------------------------------
    # OPEN IMAGE
    # --------------------------------------------------------

    image = Image.open(
        image_path
    ).convert("RGB")

    draw = ImageDraw.Draw(image)


    # --------------------------------------------------------
    # IMAGE-SPECIFIC COUNTS
    # --------------------------------------------------------

    image_species = Counter()

    valid_detections = []


    # --------------------------------------------------------
    # PROCESS DETECTIONS
    # --------------------------------------------------------

    for detection in detections:

        detection_conf = float(
            detection.get("conf", 0)
        )


        # Ignore weak detections.
        if detection_conf < DETECTION_THRESHOLD:
            continue


        classifications = detection.get(
            "classifications",
            []
        )


        # No SpeciesNet classification.
        if not classifications:
            continue


        # ----------------------------------------------------
        # GET BEST SPECIES PREDICTION
        # ----------------------------------------------------

        best_classification = max(
            classifications,
            key=lambda x: float(x[1])
        )


        species_id = str(
            best_classification[0]
        )

        species_conf = float(
            best_classification[1]
        )


        # Ignore weak species predictions.
        if species_conf < SPECIES_THRESHOLD:
            continue


        species_name = get_species_name(
            species_id
        )


        # ----------------------------------------------------
        # COUNT
        # ----------------------------------------------------

        image_species[species_name] += 1
        overall_species[species_name] += 1

        total_animals += 1


        # ----------------------------------------------------
        # STORE DETECTION
        # ----------------------------------------------------

        valid_detections.append(
            {
                "bbox": detection["bbox"],
                "species": species_name,
                "species_conf": species_conf,
                "detection_conf": detection_conf
            }
        )


    # --------------------------------------------------------
    # IMAGE COUNT
    # --------------------------------------------------------

    total_images += 1


    # --------------------------------------------------------
    # DRAW BOUNDING BOXES
    # --------------------------------------------------------

    image_width, image_height = image.size


    for detection in valid_detections:

        bbox = detection["bbox"]

        species_name = detection["species"]

        species_conf = detection["species_conf"]

        detection_conf = detection["detection_conf"]


        # SpeciesNet/MegaDetector bounding boxes
        # are normalized:
        #
        # [x, y, width, height]

        x = bbox[0] * image_width
        y = bbox[1] * image_height

        w = bbox[2] * image_width
        h = bbox[3] * image_height

        x1 = int(x)
        y1 = int(y)

        x2 = int(x + w)
        y2 = int(y + h)


        # ----------------------------------------------------
        # LABEL
        # ----------------------------------------------------

        label = (
            f"{species_name} "
            f"{species_conf:.0%}"
        )


        # ----------------------------------------------------
        # DRAW BOX
        # ----------------------------------------------------

        draw.rectangle(
            [x1, y1, x2, y2],
            outline="red",
            width=4
        )


        # ----------------------------------------------------
        # LABEL SIZE
        # ----------------------------------------------------

        try:
            font = ImageFont.truetype(
                "arial.ttf",
                24
            )
        except:
            font = ImageFont.load_default()


        bbox_text = draw.textbbox(
            (x1, y1),
            label,
            font=font
        )

        text_width = (
            bbox_text[2] -
            bbox_text[0]
        )

        text_height = (
            bbox_text[3] -
            bbox_text[1]
        )


        # ----------------------------------------------------
        # LABEL BACKGROUND
        # ----------------------------------------------------

        label_y1 = max(
            0,
            y1 - text_height - 10
        )

        label_y2 = y1


        draw.rectangle(
            [
                x1,
                label_y1,
                x1 + text_width + 10,
                label_y2
            ],
            fill="red"
        )


        draw.text(
            (
                x1 + 5,
                label_y1 + 2
            ),
            label,
            fill="white",
            font=font
        )


    # --------------------------------------------------------
    # SAVE ANNOTATED IMAGE
    # --------------------------------------------------------

    output_path = (
        ANNOTATED_DIR /
        relative_file
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    image.save(
        output_path,
        quality=95
    )


    # --------------------------------------------------------
    # DISPLAY RESULT
    # --------------------------------------------------------

    species_text = ", ".join(
        f"{species}={count}"
        for species, count
        in image_species.items()
    )

    if not species_text:
        species_text = "No confident species"


    print(
        f"{Path(relative_file).name:<30} "
        f"Animals={sum(image_species.values()):<3} "
        f"{species_text}"
    )


    # --------------------------------------------------------
    # CSV ROW
    # --------------------------------------------------------

    csv_rows.append(
        {
            "image": relative_file,
            "total_animals": sum(
                image_species.values()
            ),
            "species_counts": species_text
        }
    )


# ============================================================
# WRITE CSV
# ============================================================

print("\nWriting CSV summary...")


with open(
    CSV_OUTPUT,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=[
            "image",
            "total_animals",
            "species_counts"
        ]
    )

    writer.writeheader()

    writer.writerows(csv_rows)


# ============================================================
# WRITE TXT SUMMARY
# ============================================================

with open(
    TXT_OUTPUT,
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "GAIA - SPECIESNET SUMMARY\n"
    )

    f.write(
        "=" * 80 + "\n\n"
    )

    f.write(
        f"Images processed: {total_images}\n"
    )

    f.write(
        f"Animal detections: {total_animals}\n\n"
    )

    f.write(
        "OVERALL SPECIES TOTALS\n"
    )

    f.write(
        "-" * 80 + "\n"
    )


    if overall_species:

        for species, count in (
            overall_species.most_common()
        ):

            f.write(
                f"{species}: {count}\n"
            )

    else:

        f.write(
            "No confident species predictions found.\n"
        )


    f.write("\n\nIMAGE-BY-IMAGE RESULTS\n")
    f.write("-" * 80 + "\n")


    for row in csv_rows:

        f.write(
            f"{row['image']} | "
            f"Animals={row['total_animals']} | "
            f"{row['species_counts']}\n"
        )


# ============================================================
# FINAL OUTPUT
# ============================================================

print()
print("=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)

print(
    f"\nImages processed : {total_images}"
)

print(
    f"Animal detections: {total_animals}"
)

print("\nSpecies totals:")
print("-" * 80)


if overall_species:

    for species, count in (
        overall_species.most_common()
    ):

        print(
            f"{species:<40} {count}"
        )

else:

    print(
        "No confident species predictions found."
    )


print()
print(
    f"Annotated images generated: "
    f"{len(csv_rows)}"
)

print("\nResults:")

print(
    f"  CSV     : {CSV_OUTPUT}"
)

print(
    f"  TXT     : {TXT_OUTPUT}"
)

print(
    f"  Images  : {ANNOTATED_DIR}"
)

print("\nOpen annotated images with:")

print(
    f'explorer "{ANNOTATED_DIR}"'
)

print("\nOpen results folder with:")

print(
    f'explorer "{RESULTS_DIR}"'
)
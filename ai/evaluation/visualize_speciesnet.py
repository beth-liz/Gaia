import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


# ============================================================
# GAIA - SPECIESNET VISUALIZATION
# ============================================================
#
# Reads:
#   speciesnet_test/predictions.json
#
# Reads original images from:
#   speciesnet_test/images/
#
# Creates annotated images in:
#   speciesnet_test/annotated_named/
#
# Bounding boxes will show:
#   Common Species Name + Confidence
#
# Example:
#   Chital 93.63%
#   Sambar 99.77%
#   Tiger 99.50%
#


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

BASE_DIR = Path("speciesnet_test")

PREDICTIONS_FILE = BASE_DIR / "predictions.json"

IMAGE_DIR = BASE_DIR / "images"

OUTPUT_DIR = BASE_DIR / "annotated_named"


# ------------------------------------------------------------
# COMMON NAME CONVERSION
# ------------------------------------------------------------
#
# SpeciesNet gives taxonomic paths such as:
#
# mammalia;artiodactyla;cervidae;axis;axis;chital
#
# We convert the final scientific/taxonomic name into a
# commonly used animal name.
#
# Add more mappings later if needed.
#

COMMON_NAME_MAP = {

    # --------------------------------------------------------
    # DEER
    # --------------------------------------------------------

    "chital": "Chital",
    "axis axis": "Chital",

    "sambar": "Sambar",
    "rusa unicolor": "Sambar",

    "red deer": "Red Deer",
    "cervus elaphus": "Red Deer",

    "sika deer": "Sika Deer",
    "cervus nippon": "Sika Deer",

    "mule deer": "Mule Deer",
    "odocoileus hemionus": "Mule Deer",

    "white-tailed deer": "White-tailed Deer",
    "odocoileus virginianus": "White-tailed Deer",

    "common fallow deer": "Fallow Deer",
    "dama dama": "Fallow Deer",

    # --------------------------------------------------------
    # WILD BOAR / PIGS
    # --------------------------------------------------------

    "wild boar": "Wild Boar",
    "sus scrofa": "Wild Boar",

    "warthog": "Warthog",
    "phacochoerus africanus": "Warthog",

    # --------------------------------------------------------
    # ELEPHANTS
    # --------------------------------------------------------

    "african savanna elephant": "African Elephant",
    "african bush elephant": "African Elephant",
    "loxodonta africana": "African Elephant",

    "african forest elephant": "African Forest Elephant",
    "loxodonta cyclotis": "African Forest Elephant",

    "asian elephant": "Asian Elephant",
    "elephas maximus": "Asian Elephant",

    "elephant": "Elephant",

    # --------------------------------------------------------
    # TIGERS
    # --------------------------------------------------------

    "tiger": "Tiger",
    "panthera tigris": "Tiger",

    # --------------------------------------------------------
    # LEOPARD
    # --------------------------------------------------------

    "leopard": "Leopard",
    "panthera pardus": "Leopard",

    # --------------------------------------------------------
    # LION
    # --------------------------------------------------------

    "lion": "Lion",
    "panthera leo": "Lion",

    # --------------------------------------------------------
    # BEAR
    # --------------------------------------------------------

    "sloth bear": "Sloth Bear",
    "melursus ursinus": "Sloth Bear",

    "brown bear": "Brown Bear",
    "ursus arctos": "Brown Bear",

    "polar bear": "Polar Bear",
    "ursus maritimus": "Polar Bear",

    "black bear": "Black Bear",
    "ursus americanus": "American Black Bear",

    # --------------------------------------------------------
    # MONKEYS
    # --------------------------------------------------------

    "northern plains gray langur": "Gray Langur",
    "semnopithecus entellus": "Gray Langur",

    "gray langur": "Gray Langur",

    "rhesus macaque": "Rhesus Macaque",
    "macaca mulatta": "Rhesus Macaque",

    "bonnet macaque": "Bonnet Macaque",
    "macaca radiata": "Bonnet Macaque",

    "long-tailed macaque": "Long-tailed Macaque",
    "macaca fascicularis": "Long-tailed Macaque",

    "macaque": "Macaque",

    # --------------------------------------------------------
    # BIRDS
    # --------------------------------------------------------

    "bird": "Bird",

    # --------------------------------------------------------
    # GENERIC TAXONOMIC CATEGORIES
    # --------------------------------------------------------

    "animal": "Animal",
    "mammalia": "Mammal",
    "artiodactyla order": "Mammal",
}


# ------------------------------------------------------------
# FONT
# ------------------------------------------------------------

def get_font(size=20):
    """
    Try to use a Windows font.
    Falls back to PIL default font if unavailable.
    """

    font_paths = [
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ]

    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                pass

    return ImageFont.load_default()


# ------------------------------------------------------------
# EXTRACT TAXONOMIC NAME
# ------------------------------------------------------------

def extract_taxon_name(taxonomic_string):
    """
    SpeciesNet prediction example:

    UUID;mammalia;artiodactyla;cervidae;axis;axis;chital

    We extract the useful taxonomic portion.
    """

    if not taxonomic_string:
        return "Unknown"

    parts = taxonomic_string.split(";")

    # Remove UUID
    if len(parts) > 1:
        parts = parts[1:]

    # Remove empty fields
    parts = [p.strip() for p in parts if p.strip()]

    if not parts:
        return "Unknown"

    # --------------------------------------------------------
    # Prefer the most specific species/common-name field.
    # Usually the final field contains the species name.
    # --------------------------------------------------------

    return parts[-1]


# ------------------------------------------------------------
# CONVERT TO COMMON NAME
# ------------------------------------------------------------

def convert_to_common_name(taxonomic_string):
    """
    Convert SpeciesNet taxonomy to a common name.

    Example:

    ...;axis;axis;chital
                ↓
             Chital
    """

    if not taxonomic_string:
        return "Unknown"

    parts = taxonomic_string.split(";")

    # Remove UUID
    if len(parts) > 1:
        parts = parts[1:]

    parts = [
        p.strip().lower()
        for p in parts
        if p.strip()
    ]

    if not parts:
        return "Unknown"

    # --------------------------------------------------------
    # Build useful combinations.
    #
    # Example:
    #
    # cervus;elaphus;red deer
    #
    # Can be checked as:
    #
    # "red deer"
    # "cervus elaphus"
    # --------------------------------------------------------

    candidates = []

    # Last field
    candidates.append(parts[-1])

    # Last two scientific fields
    if len(parts) >= 2:
        candidates.append(
            f"{parts[-2]} {parts[-1]}"
        )

    # Last three fields
    if len(parts) >= 3:
        candidates.append(
            f"{parts[-3]} {parts[-2]} {parts[-1]}"
        )

    # Check mapping
    for candidate in candidates:
        if candidate in COMMON_NAME_MAP:
            return COMMON_NAME_MAP[candidate]

    # --------------------------------------------------------
    # If no mapping exists, use the last taxonomic name.
    #
    # This means new species won't become "Unknown".
    # They'll simply show whatever SpeciesNet provided.
    # --------------------------------------------------------

    fallback = parts[-1]

    if fallback:
        return fallback.title()

    return "Unknown"


# ------------------------------------------------------------
# DRAW LABEL
# ------------------------------------------------------------

def draw_label(
    draw,
    x1,
    y1,
    x2,
    y2,
    label,
    confidence,
    image_width,
    image_height
):

    # --------------------------------------------------------
    # Font size scales with image size.
    # --------------------------------------------------------

    font_size = max(
        16,
        min(
            32,
            int(image_width / 40)
        )
    )

    font = get_font(font_size)

    confidence_text = f"{confidence * 100:.2f}%"

    text = f"{label} {confidence_text}"

    # --------------------------------------------------------
    # Text dimensions
    # --------------------------------------------------------

    bbox = draw.textbbox(
        (0, 0),
        text,
        font=font
    )

    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    padding = 6

    label_x = x1
    label_y = y1 - text_height - (padding * 2)

    # If label would go above image, put it inside box
    if label_y < 0:
        label_y = y1

    # --------------------------------------------------------
    # Label background
    # --------------------------------------------------------

    draw.rectangle(
        [
            label_x,
            label_y,
            label_x + text_width + padding * 2,
            label_y + text_height + padding * 2
        ],
        fill=(0, 0, 0)
    )

    # --------------------------------------------------------
    # Label text
    # --------------------------------------------------------

    draw.text(
        (
            label_x + padding,
            label_y + padding
        ),
        text,
        fill=(255, 255, 255),
        font=font
    )


# ------------------------------------------------------------
# MAIN VISUALIZATION
# ------------------------------------------------------------

def main():

    print("=" * 70)
    print("GAIA - SPECIESNET NAMED VISUALIZATION")
    print("=" * 70)

    # --------------------------------------------------------
    # Check predictions file
    # --------------------------------------------------------

    if not PREDICTIONS_FILE.exists():

        print()
        print("ERROR: predictions.json not found.")
        print()
        print(f"Expected:")
        print(PREDICTIONS_FILE)
        print()

        return

    # --------------------------------------------------------
    # Load predictions
    # --------------------------------------------------------

    with open(
        PREDICTIONS_FILE,
        "r",
        encoding="utf-8"
    ) as f:

        data = json.load(f)

    predictions = data.get(
        "predictions",
        []
    )

    print()
    print(f"Predictions loaded : {len(predictions)}")
    print()

    # --------------------------------------------------------
    # Create output directory
    # --------------------------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    total_images = 0
    total_boxes = 0

    # --------------------------------------------------------
    # Process every image
    # --------------------------------------------------------

    for item in predictions:

        filepath = item.get(
            "filepath",
            ""
        )

        detections = item.get(
            "detections",
            []
        )

        classifications = item.get(
            "classifications",
            {}
        )

        classes = classifications.get(
            "classes",
            []
        )

        scores = classifications.get(
            "scores",
            []
        )

        # ----------------------------------------------------
        # Locate original image
        # ----------------------------------------------------

        original_path = Path(filepath)

        if not original_path.exists():

            original_path = (
                BASE_DIR /
                filepath
            )

        if not original_path.exists():

            original_path = (
                IMAGE_DIR /
                Path(filepath).name
            )

        if not original_path.exists():

            print(
                f"WARNING: Image not found: {filepath}"
            )

            continue

        # ----------------------------------------------------
        # Open image
        # ----------------------------------------------------

        try:

            image = Image.open(
                original_path
            ).convert("RGB")

        except Exception as e:

            print(
                f"WARNING: Could not open {original_path}: {e}"
            )

            continue

        image_width, image_height = image.size

        draw = ImageDraw.Draw(image)

        # ----------------------------------------------------
        # Determine main SpeciesNet prediction
        # ----------------------------------------------------

        prediction = item.get(
            "prediction",
            ""
        )

        prediction_score = item.get(
            "prediction_score",
            0
        )

        common_name = convert_to_common_name(
            prediction
        )

        # ----------------------------------------------------
        # Process bounding boxes
        # ----------------------------------------------------

        for index, detection in enumerate(detections):

            bbox = detection.get(
                "bbox"
            )

            if not bbox or len(bbox) != 4:
                continue

            # ------------------------------------------------
            # SpeciesNet bbox is normalized:
            #
            # [x, y, width, height]
            #
            # Convert to pixels.
            # ------------------------------------------------

            x = bbox[0]
            y = bbox[1]
            w = bbox[2]
            h = bbox[3]

            x1 = int(x * image_width)
            y1 = int(y * image_height)

            x2 = int(
                (x + w) *
                image_width
            )

            y2 = int(
                (y + h) *
                image_height
            )

            # ------------------------------------------------
            # Detection confidence
            # ------------------------------------------------

            detection_confidence = detection.get(
                "conf",
                0
            )

            # ------------------------------------------------
            # SpeciesNet currently provides "animal"
            # as the detection label.
            #
            # We replace it with the classifier's species
            # prediction.
            # ------------------------------------------------

            label = common_name

            # ------------------------------------------------
            # Draw bounding box
            # ------------------------------------------------

            draw.rectangle(
                [
                    x1,
                    y1,
                    x2,
                    y2
                ],
                outline=(255, 0, 0),
                width=max(
                    2,
                    int(image_width / 400)
                )
            )

            # ------------------------------------------------
            # Draw species name + confidence
            # ------------------------------------------------

            draw_label(
                draw,
                x1,
                y1,
                x2,
                y2,
                label,
                detection_confidence,
                image_width,
                image_height
            )

            total_boxes += 1

        # ----------------------------------------------------
        # Output path
        # ----------------------------------------------------

        # Preserve original folder structure:
        #
        # images/deer/deer_1.jpg
        #
        # becomes:
        #
        # annotated_named/deer/deer_1.jpg
        #

        try:

            relative_path = original_path.relative_to(
                IMAGE_DIR
            )

        except ValueError:

            relative_path = Path(
                original_path.name
            )

        output_path = (
            OUTPUT_DIR /
            relative_path
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        # ----------------------------------------------------
        # Save
        # ----------------------------------------------------

        image.save(
            output_path,
            quality=95
        )

        total_images += 1

        print(
            f"Created: {output_path} "
            f"({len(detections)} boxes) "
            f"-> {common_name}"
        )

    # --------------------------------------------------------
    # Final summary
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("SPECIESNET NAMED VISUALIZATION COMPLETE")
    print("=" * 70)

    print(
        f"Images processed : {total_images}"
    )

    print(
        f"Bounding boxes   : {total_boxes}"
    )

    print()
    print(
        f"Output folder: {OUTPUT_DIR}"
    )

    print()
    print("Open the output folder with:")
    print(
        f'explorer "{OUTPUT_DIR}"'
    )

    print()


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

if __name__ == "__main__":
    main()
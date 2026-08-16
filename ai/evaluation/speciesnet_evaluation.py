import json
import os
from collections import defaultdict

PREDICTIONS_FILE = "speciesnet_test/predictions.json"

TARGET_SPECIES = {
    "deer": "deer",
    "elephant": "elephant",
    "monkey": "monkey",
    "tiger": "tiger",
    "wild boar": "wild boar",
}


def extract_species(prediction):
    """
    Convert SpeciesNet's detailed taxonomy into Gaia's
    five target animal categories.
    """

    p = prediction.lower()

    if "elephant" in p:
        return "elephant"

    if "tiger" in p:
        return "tiger"

    if "chital" in p or "sambar" in p or "deer" in p:
        return "deer"

    if (
        "langur" in p
        or "macaque" in p
        or "monkey" in p
        or "cercopithecidae" in p
        or "semnopithecus" in p
        or "macaca" in p
    ):
        return "monkey"

    if "wild boar" in p or "sus;scrofa" in p:
        return "wild boar"

    return "unknown"


def get_expected_species(filepath):
    path = filepath.lower()

    for folder, species in TARGET_SPECIES.items():
        if f"/{folder}/" in path or f"\\{folder}\\" in path:
            return species

    return "unknown"


with open(PREDICTIONS_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

predictions = data["predictions"]

results = []

for item in predictions:

    filepath = item["filepath"]

    expected = get_expected_species(filepath)

    prediction = item.get("prediction", "")

    predicted = extract_species(prediction)

    score = item.get("prediction_score", 0)

    detections = item.get("detections", [])

    # Keep only reasonably confident animal detections
    valid_detections = [
        d for d in detections
        if d.get("label") == "animal"
        and d.get("conf", 0) >= 0.30
    ]

    detection_count = len(valid_detections)

    correct = expected == predicted

    results.append({
        "file": filepath,
        "expected": expected,
        "predicted": predicted,
        "correct": correct,
        "confidence": score,
        "detections": detection_count
    })


# ---------------------------------------------------------
# OVERALL RESULTS
# ---------------------------------------------------------

total = len(results)
correct = sum(r["correct"] for r in results)

accuracy = (correct / total * 100) if total else 0

avg_confidence = (
    sum(r["confidence"] for r in results) / total
    if total else 0
)


print()
print("=" * 80)
print("GAIA - SPECIESNET EVALUATION")
print("=" * 80)

print(f"Total images       : {total}")
print(f"Correct            : {correct}")
print(f"Incorrect          : {total - correct}")
print(f"Overall accuracy   : {accuracy:.2f}%")
print(f"Average confidence : {avg_confidence:.3f}")

print()
print("=" * 80)
print("PER-SPECIES RESULTS")
print("=" * 80)


species_results = defaultdict(list)

for r in results:
    species_results[r["expected"]].append(r)


for species in TARGET_SPECIES.values():

    data = species_results[species]

    if not data:
        continue

    total_species = len(data)
    correct_species = sum(r["correct"] for r in data)

    species_accuracy = (
        correct_species / total_species * 100
    )

    avg_species_conf = (
        sum(r["confidence"] for r in data)
        / total_species
    )

    avg_detections = (
        sum(r["detections"] for r in data)
        / total_species
    )

    print()
    print(species.upper())
    print("-" * 40)

    print(
        f"Correct          : "
        f"{correct_species}/{total_species}"
    )

    print(
        f"Accuracy         : "
        f"{species_accuracy:.2f}%"
    )

    print(
        f"Avg confidence   : "
        f"{avg_species_conf:.3f}"
    )

    print(
        f"Avg detections   : "
        f"{avg_detections:.2f}"
    )


# ---------------------------------------------------------
# CONFUSION / WRONG PREDICTIONS
# ---------------------------------------------------------

print()
print("=" * 80)
print("INCORRECT PREDICTIONS")
print("=" * 80)

wrong = [r for r in results if not r["correct"]]

if not wrong:
    print("None!")
else:

    for r in wrong:

        filename = os.path.basename(r["file"])

        print(
            f"{filename:25} "
            f"Expected={r['expected']:10} "
            f"Predicted={r['predicted']:10} "
            f"Confidence={r['confidence']:.3f}"
        )


# ---------------------------------------------------------
# DETECTION SUMMARY
# ---------------------------------------------------------

print()
print("=" * 80)
print("DETECTION SUMMARY")
print("=" * 80)

total_detections = sum(r["detections"] for r in results)

print(f"Total animal detections : {total_detections}")

if total:
    print(
        f"Average detections/image : "
        f"{total_detections / total:.2f}"
    )

print()
print("=" * 80)
print("EVALUATION COMPLETE")
print("=" * 80)
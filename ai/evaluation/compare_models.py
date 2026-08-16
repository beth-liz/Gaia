import pandas as pd

models = {
    "YOLO11s": "results/elephant_evaluation_yolo11s/comparison_report.csv",
    "YOLO11m": "results/elephant_evaluation_yolo11m/comparison_report.csv",
    "YOLO11l": "results/elephant_evaluation_yolo11l/comparison_report.csv",
}

print("\n" + "=" * 80)
print("YOLO MODEL COMPARISON")
print("=" * 80)

for model_name, file_path in models.items():

    df = pd.read_csv(file_path)

    correct = (df["result"] == "Correct count").sum()
    total = len(df)

    accuracy = (correct / total) * 100
    mae = df["difference"].abs().mean()
    avg_conf = df["average_confidence"].mean()

    print(f"\n{model_name}")
    print("-" * 40)
    print(f"Correct counts      : {correct}/{total}")
    print(f"Count accuracy      : {accuracy:.2f}%")
    print(f"Mean absolute error : {mae:.2f}")
    print(f"Average confidence  : {avg_conf:.3f}")

print("\n" + "=" * 80)
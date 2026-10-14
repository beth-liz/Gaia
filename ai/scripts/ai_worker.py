import sys
import json
import traceback

def main():
    try:
        import speciesnet
        model = speciesnet.SpeciesNet(model_name=speciesnet.DEFAULT_MODEL)
    except Exception as e:
        print(json.dumps({"error": f"Failed to initialize model: {e}"}))
        sys.stdout.flush()
        return

    print("READY")
    sys.stdout.flush()

    for line in sys.stdin:
        filepath = line.strip()
        if not filepath:
            continue
        if filepath == "EXIT":
            break

        try:
            from PIL import Image
            from speciesnet.utils import BBox
            
            img = Image.open(filepath)
            
            # 1. Detector
            det_input = model.detector.preprocess(img)
            det_results = model.detector.predict(filepath, det_input)
            
            detections = det_results.get("detections", [])
            valid_detections = []
            
            # 2. Classifier per box
            for d in detections:
                bbox_obj = BBox(*d["bbox"])
                clf_input = model.classifier.preprocess(img, bboxes=[bbox_obj])
                clf_results = model.classifier.predict(filepath, clf_input)
                
                d["classifications"] = clf_results.get("classifications")
                valid_detections.append(d)
                
            print(json.dumps({
                "status": "success", 
                "results": {
                    "predictions": [{
                        "filepath": filepath,
                        "detections": valid_detections
                    }]
                },
                "metadata": {
                    "model": speciesnet.DEFAULT_MODEL,
                    "pipeline": "MegaDetector + SpeciesNet Ensemble"
                }
            }))
        except Exception as e:
            err_msg = str(e)
            if not err_msg:
                err_msg = traceback.format_exc()
            print(json.dumps({"status": "error", "error": err_msg}))
        
        sys.stdout.flush()

if __name__ == "__main__":
    main()

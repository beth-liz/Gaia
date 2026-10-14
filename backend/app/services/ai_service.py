import os
import sys
import json
import subprocess
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent.parent.parent / "ai"
PYTHON_EXE = AI_DIR / "venv" / "Scripts" / "python.exe"
WORKER_SCRIPT = AI_DIR / "scripts" / "ai_worker.py"

class AIServiceDaemon:
    def __init__(self):
        self.process = None
        self._start_daemon()

    def _start_daemon(self):
        if not PYTHON_EXE.exists():
            raise RuntimeError(f"AI Python env not found: {PYTHON_EXE}")

        self.process = subprocess.Popen(
            [str(PYTHON_EXE), str(WORKER_SCRIPT)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(AI_DIR),
            text=True,
            bufsize=1
        )
        # Wait for ready signal
        while True:
            ready_line = self.process.stdout.readline()
            if not ready_line:
                raise RuntimeError("AI Worker closed stdout before sending READY")
            ready_line = ready_line.strip()
            if ready_line == "READY":
                break
            if "error" in ready_line.lower():
                raise RuntimeError(f"AI Worker failed to start: {ready_line}")

    def close(self):
        if self.process and self.process.poll() is None:
            try:
                self.process.stdin.write("EXIT\n")
                self.process.stdin.flush()
                self.process.wait(timeout=3)
            except Exception:
                self.process.kill()

    def __del__(self):
        self.close()

    def map_species(self, prediction: str) -> str:
        if not prediction:
            return "Other / Unknown"
            
        p = prediction.lower()
        if "elephant" in p: return "Elephant"
        if "tiger" in p: return "Tiger"
        if "leopard" in p: return "Leopard"
        if "bear" in p: return "Bear"
        if "chital" in p or "sambar" in p or "deer" in p: return "Deer"
        if "langur" in p or "macaque" in p or "monkey" in p or "cercopithecidae" in p or "semnopithecus" in p or "macaca" in p:
            return "Monkey"
        if "wild boar" in p or "sus;scrofa" in p or "boar" in p:
            return "Wild Boar"
        return "Other / Unknown"

    def analyze_image(self, filepath: str):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Image not found: {filepath}")

        if self.process.poll() is not None:
            self._start_daemon()

        self.process.stdin.write(filepath + "\n")
        self.process.stdin.flush()
        
        output = self.process.stdout.readline().strip()
        if not output:
            raise RuntimeError("AI Worker crashed unexpectedly.")

        try:
            data = json.loads(output)
        except json.JSONDecodeError:
            raise RuntimeError(f"Malformed AI output: {output}")

        if data.get("status") == "error":
            raise RuntimeError(f"AI Inference failed: {data.get('error')}")

        results = data.get("results", {})
        
        # Parse logic based on SpeciesNet result format
        if not results or "predictions" not in results or len(results["predictions"]) == 0:
             return {"status": "success", "detections": [], "animal_count": 0}

        pred_data = results["predictions"][0]
        raw_detections = pred_data.get("detections", [])
        
        valid_detections = []
        total_animal_count = 0
        species_counts = {}
        uncertain_count = 0
        
        # Explicit thresholds
        DETECTOR_CONF_THRESHOLD = 0.20
        SPECIES_CONF_THRESHOLD = 0.50
        
        for d in raw_detections:
            conf = d.get("conf", 0)
            # Step A: Animal Detection Filter
            # Verify detector identified an animal with sufficient confidence
            if d.get("label") == "animal" and conf >= DETECTOR_CONF_THRESHOLD:
                classifications = d.get("classifications") or {}
                classes = classifications.get("classes", [])
                scores = classifications.get("scores", [])
                
                best_class = classes[0] if classes else "Unknown"
                best_score = float(scores[0]) if scores else 0.0
                
                # Check if SpeciesNet confidently classified the crop as non-animal (blank/vehicle/human)
                is_explicit_non_animal = (
                    best_score >= SPECIES_CONF_THRESHOLD and 
                    ("blank" in best_class.lower() or "vehicle" in best_class.lower() or "human" in best_class.lower())
                )
                if is_explicit_non_animal:
                    continue
                
                # Retain detection as valid animal
                total_animal_count += 1
                
                # Step B: Species Classification & Uncertainty evaluation
                if best_score >= SPECIES_CONF_THRESHOLD:
                    mapped_species = self.map_species(best_class)
                    is_uncertain = (mapped_species == "Other / Unknown")
                else:
                    mapped_species = "Other / Unknown"
                    is_uncertain = True
                
                if is_uncertain:
                    uncertain_count += 1
                else:
                    species_counts[mapped_species] = species_counts.get(mapped_species, 0) + 1
                
                valid_detections.append({
                    "bbox": d.get("bbox", [0, 0, 0, 0]),
                    "confidence": conf,
                    "raw_species": best_class,
                    "normalized_species": mapped_species,
                    "species_confidence": best_score,
                    "is_uncertain": is_uncertain
                })
        
        # Step C: Determine overall species and overall confidence
        overall_species = "Other / Unknown"
        overall_confidence = 0.0
        
        if species_counts:
            # Pick the most prevalent confidently-classified species
            best_sp = max(species_counts.items(), key=lambda x: x[1])[0]
            overall_species = best_sp
            # Get maximum classification confidence for that species
            overall_confidence = max(
                vd["species_confidence"] for vd in valid_detections if vd["normalized_species"] == best_sp
            )
        elif valid_detections:
            # All animals have uncertain classifications
            overall_species = "Other / Unknown"
            overall_confidence = max(vd["confidence"] for vd in valid_detections)
            
        return {
            "status": "success",
            "file": filepath,
            "animal_count": total_animal_count,
            "species_counts": species_counts,
            "uncertain_count": uncertain_count,
            "overall_species": overall_species,
            "overall_confidence": overall_confidence,
            "detections": valid_detections,
            "metadata": data.get("metadata", {})
        }

# Global instance for reuse
ai_daemon = None

def get_ai_service():
    global ai_daemon
    if ai_daemon is None:
        ai_daemon = AIServiceDaemon()
    return ai_daemon

def analyze_image(filepath: str):
    service = get_ai_service()
    return service.analyze_image(filepath)

if __name__ == "__main__":
    img = str(AI_DIR / "speciesnet_test" / "images" / "tiger" / "tiger_1.jpg")
    print(analyze_image(img))

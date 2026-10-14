from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from typing import List, Optional

from app.database.deps import get_db
from app.models.animal_detection import AnimalDetection
from app.schemas.animal_detection import AnimalDetectionResponse
from app.services.ai_service import analyze_image

router = APIRouter(
    prefix="/ai",
    tags=["AI Detections"]
)

# Use existing static upload directory logic
UPLOAD_DIR = os.path.join("app", "static", "uploads", "detections")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/detect", response_model=AnimalDetectionResponse)
async def perform_detection(
    image: UploadFile = File(...),
    station_id: Optional[int] = None,
    incident_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save uploaded file
    ext = os.path.splitext(image.filename)[1] or ".jpg"
    filename = f"detect_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        # Run AI Service
        result = analyze_image(filepath)

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))

        # Create database record
        db_detection = AnimalDetection(
            animal_name=result.get("overall_species", "Unknown"),
            normalized_species=result.get("overall_species", "Unknown"),
            confidence=result.get("overall_confidence", 0.0),
            count=result.get("animal_count", 0),
            bounding_boxes=result.get("detections", []),
            image_path=f"/static/uploads/detections/{filename}",
            station_id=station_id,
            incident_id=incident_id,
            model_info=result.get("metadata", {}).get("pipeline")
        )
        
        db.add(db_detection)
        db.commit()
        db.refresh(db_detection)
        
        return db_detection
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/detections", response_model=List[AnimalDetectionResponse])
def get_detections(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(AnimalDetection).order_by(AnimalDetection.detected_at.desc()).limit(limit).all()

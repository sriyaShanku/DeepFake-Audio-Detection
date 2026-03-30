import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database.db import get_db
from models.schemas import PredictResponse
from services.audio_processor import extract_features
import services.model_handler as model_handler
from services.db_service import save_scan_result

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/predict", response_model=PredictResponse)
async def predict_audio_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.wav', '.mp3')):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .wav and .mp3 supported.")
        
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file temporarily
        with open(file_location, "wb") as f:
            f.write(await file.read())
            
        file_size_kb = os.path.getsize(file_location) / 1024.0
        
        # Audio Processing
        features, duration = extract_features(file_location)
        if features is None:
            raise HTTPException(status_code=500, detail="Failed to process audio file.")
            
        # Prediction
        try:
            result_text, confidence, risk_level = model_handler.predict_audio(features)
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))
        
        # Save to DB
        saved_scan = save_scan_result(
            db=db,
            filename=file.filename,
            file_size=file_size_kb,
            duration=duration,
            result=result_text,
            confidence=confidence,
            risk_level=risk_level
        )
        
        response_data = {
            "status": "success",
            "filename": file.filename,
            "result": result_text,
            "confidence": confidence,
            "risk_level": risk_level,
            "duration": round(duration, 2),
            "features_extracted": ["mfcc", "spectral_contrast", "chroma", "zcr"],
            "timestamp": saved_scan.timestamp
        }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")
    finally:
        # Auto-cleanup
        if os.path.exists(file_location):
            try:
                os.remove(file_location)
            except Exception as e:
                print(f"Cleanup failed for {file_location}: {e}")

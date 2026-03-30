from sqlalchemy.orm import Session
from database.tables import ScanHistory
from datetime import datetime
import json

def save_scan_result(db: Session, filename: str, file_size: float, duration: float, result: str, confidence: float, risk_level: str):
    db_scan = ScanHistory(
        filename=filename,
        file_size=file_size,
        duration=duration,
        result=result,
        confidence=confidence,
        risk_level=risk_level,
        features_used=json.dumps(["mfcc", "spectral_contrast", "chroma", "zcr"]),
        model_used="RandomForest",
        timestamp=datetime.utcnow()
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

def get_all_scans(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ScanHistory).order_by(ScanHistory.timestamp.desc()).offset(skip).limit(limit).all()

def delete_scan(db: Session, scan_id: int):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if scan:
        db.delete(scan)
        db.commit()
        return True
    return False

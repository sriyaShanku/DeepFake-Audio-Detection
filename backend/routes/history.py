from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from models.schemas import ScanHistoryResponse, DeleteResponse
from services.db_service import get_all_scans, delete_scan

router = APIRouter()

@router.get("/history", response_model=List[ScanHistoryResponse])
def read_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    scans = get_all_scans(db, skip=skip, limit=limit)
    return scans

@router.delete("/history/{scan_id}", response_model=DeleteResponse)
def delete_history_record(scan_id: int, db: Session = Depends(get_db)):
    success = delete_scan(db, scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return {"status": "deleted", "id": scan_id}

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PredictResponse(BaseModel):
    status: str
    filename: str
    result: str
    confidence: float
    risk_level: str
    duration: float
    features_extracted: List[str]
    timestamp: datetime

class ErrorResponse(BaseModel):
    status: str
    message: str

class ScanHistoryResponse(BaseModel):
    id: int
    filename: str
    result: str
    confidence: float
    duration: float
    timestamp: datetime

    class Config:
        from_attributes = True

class DeleteResponse(BaseModel):
    status: str
    id: int

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime
from database.db import Base

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_size = Column(Float)
    duration = Column(Float)
    result = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String)
    features_used = Column(Text)
    model_used = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

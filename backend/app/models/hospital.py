from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone
from app.db.database import Base

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    trauma_level = Column(String, default="Level 1 Trauma Center")
    total_er_beds = Column(Integer, default=30)
    available_er_beds = Column(Integer, default=12)
    total_icu_beds = Column(Integer, default=10)
    available_icu_beds = Column(Integer, default=4)
    er_status = Column(String, default="OPEN") # OPEN, BUSY, DIVERSION
    specialties = Column(JSON, default=list) # ["Cardiology", "Neurology", "Pediatrics", "Trauma"]
    contact_number = Column(String, nullable=True)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from datetime import datetime, timezone
from app.db.database import Base

class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)
    callsign = Column(String, unique=True, index=True, nullable=False) # e.g., AMB-101
    vehicle_number = Column(String, nullable=False) # e.g., NY-MED-4421
    type = Column(String, nullable=False) # ALS (Advanced), BLS (Basic), MICU (Mobile ICU)
    status = Column(String, nullable=False, default="AVAILABLE") # AVAILABLE, DISPATCHED, ON_SCENE, TRANSPORTING, MAINTENANCE
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    equipment = Column(JSON, nullable=False, default=list) # ["Defibrillator", "Ventilator", "Oxygen", "Trauma Kit", "BVM"]
    driver_name = Column(String, nullable=False, default="Unassigned Driver")
    driver_phone = Column(String, nullable=True)
    driver_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    trips_today = Column(Integer, default=0)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

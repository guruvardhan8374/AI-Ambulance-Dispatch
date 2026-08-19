from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from datetime import datetime, timezone
from app.db.database import Base

class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)
    caller_name = Column(String, nullable=False)
    caller_phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    emergency_type = Column(String, nullable=False) # Cardiac, Stroke, Trauma, Respiratory, Obstetric, Allergic, Burn, Minor
    symptoms = Column(Text, nullable=True)
    patient_count = Column(Integer, default=1)
    special_requirements = Column(JSON, default=list) # ["Pediatric", "Bariatric", "Oxygen Needed", "Ventilator Needed"]
    
    # AI Classification Outputs
    priority = Column(String, nullable=True) # CRITICAL, HIGH, MEDIUM, LOW
    ai_severity_score = Column(Float, nullable=True) # 0 to 100
    ai_recommended_type = Column(String, nullable=True) # ALS, BLS, MICU
    ai_required_equipment = Column(JSON, default=list)
    ai_urgency_reason = Column(Text, nullable=True)
    
    # Lifecycle & Dispatch state
    status = Column(String, default="PENDING") # PENDING, DISPATCHED, EN_ROUTE, ON_SCENE, TRANSPORTING, ARRIVED_HOSPITAL, RESOLVED, CANCELLED
    assigned_ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=True)
    target_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    is_dispatcher_override = Column(Boolean, default=False)
    override_reason = Column(String, nullable=True)
    
    # Timestamps for response metrics
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dispatched_at = Column(DateTime, nullable=True)
    arrived_scene_at = Column(DateTime, nullable=True)
    arrived_hospital_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

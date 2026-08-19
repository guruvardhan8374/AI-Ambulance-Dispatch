from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime, timezone
from app.db.database import Base

class DispatchLog(Base):
    __tablename__ = "dispatch_logs"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False)
    action = Column(String, nullable=False) # AI_TRIAGED, DISPATCH_RECOMMENDED, DISPATCH_OVERRIDDEN, AMBULANCE_DISPATCHED, AMBULANCE_ON_SCENE, HOSPITAL_NOTIFIED, HOSPITAL_ACCEPTED, RESOLVED
    actor_role = Column(String, nullable=False) # SYSTEM, DISPATCHER, DRIVER, HOSPITAL, CALLER
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

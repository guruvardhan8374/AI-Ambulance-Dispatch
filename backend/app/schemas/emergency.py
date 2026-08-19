from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EmergencyCreate(BaseModel):
    caller_name: str
    caller_phone: str
    address: str
    latitude: float
    longitude: float
    emergency_type: str
    symptoms: Optional[str] = ""
    patient_count: int = 1
    special_requirements: List[str] = []

class EmergencyStatusUpdate(BaseModel):
    status: str
    assigned_ambulance_id: Optional[int] = None
    target_hospital_id: Optional[int] = None

class DispatchOverrideRequest(BaseModel):
    ambulance_id: int
    hospital_id: Optional[int] = None
    override_reason: str

class EmergencyResponse(BaseModel):
    id: int
    caller_name: str
    caller_phone: str
    address: str
    latitude: float
    longitude: float
    emergency_type: str
    symptoms: Optional[str]
    patient_count: int
    special_requirements: List[str]
    priority: Optional[str]
    ai_severity_score: Optional[float]
    ai_recommended_type: Optional[str]
    ai_required_equipment: List[str]
    ai_urgency_reason: Optional[str]
    status: str
    assigned_ambulance_id: Optional[int]
    target_hospital_id: Optional[int]
    is_dispatcher_override: bool
    override_reason: Optional[str]
    created_at: datetime
    dispatched_at: Optional[datetime]
    arrived_scene_at: Optional[datetime]
    arrived_hospital_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

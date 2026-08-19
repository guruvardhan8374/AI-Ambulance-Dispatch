from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AmbulanceLocationUpdate(BaseModel):
    latitude: float
    longitude: float

class AmbulanceStatusUpdate(BaseModel):
    status: str

class AmbulanceResponse(BaseModel):
    id: int
    callsign: str
    vehicle_number: str
    type: str
    status: str
    latitude: float
    longitude: float
    equipment: List[str]
    driver_name: str
    driver_phone: Optional[str]
    driver_user_id: Optional[int]
    trips_today: int
    last_updated: datetime

    class Config:
        from_attributes = True

class AmbulanceRecommendation(BaseModel):
    ambulance: AmbulanceResponse
    distance_km: float
    eta_minutes: float
    match_score: float
    equipment_match_percent: float
    reasons: List[str]

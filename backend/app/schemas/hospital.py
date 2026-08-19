from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class HospitalUpdate(BaseModel):
    available_er_beds: Optional[int] = None
    available_icu_beds: Optional[int] = None
    er_status: Optional[str] = None

class HospitalResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    trauma_level: str
    total_er_beds: int
    available_er_beds: int
    total_icu_beds: int
    available_icu_beds: int
    er_status: str
    specialties: List[str]
    contact_number: Optional[str]
    last_updated: datetime

    class Config:
        from_attributes = True

class HospitalRecommendation(BaseModel):
    hospital: HospitalResponse
    distance_km: float
    eta_minutes: float
    suitability_score: float
    match_reasons: List[str]

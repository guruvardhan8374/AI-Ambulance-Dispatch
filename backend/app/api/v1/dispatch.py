from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.deps import get_db
from app.models.emergency import Emergency
from app.models.ambulance import Ambulance
from app.models.hospital import Hospital
from app.schemas.ambulance import AmbulanceRecommendation
from app.schemas.hospital import HospitalRecommendation
from app.services.ai_dispatch_optimizer import rank_ambulances
from app.services.ai_hospital_matcher import rank_hospitals

router = APIRouter()

@router.get("/recommend-ambulances/{emergency_id}", response_model=List[AmbulanceRecommendation])
def get_recommended_ambulances(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    # Get available ambulances (or currently dispatched to allow dispatcher reassignment)
    available_ambulances = db.query(Ambulance).filter(Ambulance.status.in_(["AVAILABLE", "DISPATCHED"])).all()
    
    recommendations = rank_ambulances(
        ambulances=available_ambulances,
        emergency_lat=emergency.latitude,
        emergency_lon=emergency.longitude,
        recommended_type=emergency.ai_recommended_type or "ALS",
        required_equipment=emergency.ai_required_equipment or []
    )

    return recommendations

@router.get("/recommend-hospitals/{emergency_id}", response_model=List[HospitalRecommendation])
def get_recommended_hospitals(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    hospitals = db.query(Hospital).all()
    recommendations = rank_hospitals(
        hospitals=hospitals,
        emergency_lat=emergency.latitude,
        emergency_lon=emergency.longitude,
        priority=emergency.priority or "MEDIUM",
        emergency_type=emergency.emergency_type
    )

    return recommendations

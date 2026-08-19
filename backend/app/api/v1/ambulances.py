from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.api.deps import get_db
from app.models.ambulance import Ambulance
from app.schemas.ambulance import AmbulanceResponse, AmbulanceLocationUpdate, AmbulanceStatusUpdate
from app.core.websocket_manager import ws_manager

router = APIRouter()

@router.get("/", response_model=List[AmbulanceResponse])
def get_ambulances(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ambulance)
    if status_filter:
        query = query.filter(Ambulance.status == status_filter)
    return query.all()

@router.get("/{ambulance_id}", response_model=AmbulanceResponse)
def get_ambulance(ambulance_id: int, db: Session = Depends(get_db)):
    amb = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return amb

@router.patch("/{ambulance_id}/location", response_model=AmbulanceResponse)
async def update_ambulance_location(
    ambulance_id: int,
    location: AmbulanceLocationUpdate,
    db: Session = Depends(get_db)
):
    amb = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    amb.latitude = location.latitude
    amb.longitude = location.longitude
    amb.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(amb)

    await ws_manager.broadcast({
        "type": "AMBULANCE_LOCATION_UPDATED",
        "ambulance_id": amb.id,
        "callsign": amb.callsign,
        "latitude": amb.latitude,
        "longitude": amb.longitude,
        "status": amb.status
    })

    return amb

@router.patch("/{ambulance_id}/status", response_model=AmbulanceResponse)
async def update_ambulance_status(
    ambulance_id: int,
    status_in: AmbulanceStatusUpdate,
    db: Session = Depends(get_db)
):
    amb = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    amb.status = status_in.status
    amb.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(amb)

    await ws_manager.broadcast({
        "type": "AMBULANCE_STATUS_CHANGED",
        "ambulance_id": amb.id,
        "callsign": amb.callsign,
        "status": amb.status
    })

    return amb

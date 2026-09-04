from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.hospital import Hospital
from app.schemas.hospital import HospitalResponse, HospitalUpdate
from app.core.websocket_manager import ws_manager

router = APIRouter()

@router.get("/", response_model=List[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db)):
    return db.query(Hospital).all()

@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital(hospital_id: int, db: Session = Depends(get_db)):
    hosp = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hosp

@router.patch("/{hospital_id}", response_model=HospitalResponse)
async def update_hospital_capacity(
    hospital_id: int,
    update: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["HOSPITAL", "DISPATCHER"]))
):
    hosp = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if update.available_er_beds is not None:
        hosp.available_er_beds = max(0, min(hosp.total_er_beds, update.available_er_beds))
    if update.available_icu_beds is not None:
        hosp.available_icu_beds = max(0, min(hosp.total_icu_beds, update.available_icu_beds))
    if update.er_status is not None:
        hosp.er_status = update.er_status

    hosp.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(hosp)

    await ws_manager.broadcast({
        "type": "HOSPITAL_CAPACITY_UPDATED",
        "hospital_id": hosp.id,
        "name": hosp.name,
        "available_er_beds": hosp.available_er_beds,
        "available_icu_beds": hosp.available_icu_beds,
        "er_status": hosp.er_status
    })

    return hosp

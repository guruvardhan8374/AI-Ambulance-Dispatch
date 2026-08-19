from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.models.emergency import Emergency
from app.models.ambulance import Ambulance
from app.models.hospital import Hospital
from app.models.log import DispatchLog
from app.schemas.emergency import EmergencyCreate, EmergencyResponse, EmergencyStatusUpdate, DispatchOverrideRequest
from app.services.ai_classifier import classify_emergency
from app.core.websocket_manager import ws_manager

router = APIRouter()

@router.post("/", response_model=EmergencyResponse)
async def create_emergency_request(
    req: EmergencyCreate,
    db: Session = Depends(get_db)
):
    # Run AI Classification
    triage = classify_emergency(
        emergency_type=req.emergency_type,
        symptoms=req.symptoms,
        patient_count=req.patient_count,
        special_requirements=req.special_requirements
    )

    emergency = Emergency(
        caller_name=req.caller_name,
        caller_phone=req.caller_phone,
        address=req.address,
        latitude=req.latitude,
        longitude=req.longitude,
        emergency_type=req.emergency_type,
        symptoms=req.symptoms,
        patient_count=req.patient_count,
        special_requirements=req.special_requirements,
        priority=triage["priority"],
        ai_severity_score=triage["ai_severity_score"],
        ai_recommended_type=triage["ai_recommended_type"],
        ai_required_equipment=triage["ai_required_equipment"],
        ai_urgency_reason=triage["ai_urgency_reason"],
        status="PENDING",
        created_at=datetime.now(timezone.utc)
    )

    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    # Add log
    log = DispatchLog(
        emergency_id=emergency.id,
        action="AI_TRIAGED",
        actor_role="SYSTEM",
        description=f"AI Triaged emergency #{emergency.id} as {emergency.priority} priority (Score: {emergency.ai_severity_score})."
    )
    db.add(log)
    db.commit()

    # Broadcast real-time websocket event
    await ws_manager.broadcast({
        "type": "EMERGENCY_CREATED",
        "emergency_id": emergency.id,
        "priority": emergency.priority,
        "emergency_type": emergency.emergency_type,
        "caller_name": emergency.caller_name,
        "address": emergency.address,
        "latitude": emergency.latitude,
        "longitude": emergency.longitude
    })

    return emergency

@router.get("/", response_model=List[EmergencyResponse])
def get_emergencies(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Emergency)
    if status_filter:
        query = query.filter(Emergency.status == status_filter)
    return query.order_by(Emergency.created_at.desc()).all()

@router.get("/{emergency_id}", response_model=EmergencyResponse)
def get_emergency_detail(emergency_id: int, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    return emergency

@router.patch("/{emergency_id}/status", response_model=EmergencyResponse)
async def update_emergency_status(
    emergency_id: int,
    update: EmergencyStatusUpdate,
    db: Session = Depends(get_db)
):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    old_status = emergency.status
    emergency.status = update.status
    now = datetime.now(timezone.utc)

    if update.status == "DISPATCHED" and not emergency.dispatched_at:
        emergency.dispatched_at = now
    elif update.status == "ON_SCENE" and not emergency.arrived_scene_at:
        emergency.arrived_scene_at = now
    elif update.status == "ARRIVED_HOSPITAL" and not emergency.arrived_hospital_at:
        emergency.arrived_hospital_at = now
    elif update.status == "RESOLVED" and not emergency.resolved_at:
        emergency.resolved_at = now

    target_amb_id = update.assigned_ambulance_id or emergency.assigned_ambulance_id
    if target_amb_id:
        emergency.assigned_ambulance_id = target_amb_id
        amb = db.query(Ambulance).filter(Ambulance.id == target_amb_id).first()
        if amb:
            if update.status == "RESOLVED":
                amb.status = "AVAILABLE"
                if old_status != "RESOLVED":
                    amb.trips_today += 1
            elif update.status in ["DISPATCHED", "EN_ROUTE"]:
                amb.status = "DISPATCHED"
            elif update.status == "ON_SCENE":
                amb.status = "ON_SCENE"
            elif update.status in ["TRANSPORTING", "ARRIVED_HOSPITAL"]:
                amb.status = "TRANSPORTING"

    if update.target_hospital_id:
        emergency.target_hospital_id = update.target_hospital_id

    db.commit()
    db.refresh(emergency)

    # Log action
    log = DispatchLog(
        emergency_id=emergency.id,
        action=f"STATUS_{update.status}",
        actor_role="USER",
        description=f"Status updated from {old_status} to {update.status}."
    )
    db.add(log)
    db.commit()

    # Broadcast update
    await ws_manager.broadcast({
        "type": "EMERGENCY_STATUS_UPDATED",
        "emergency_id": emergency.id,
        "old_status": old_status,
        "new_status": emergency.status,
        "assigned_ambulance_id": emergency.assigned_ambulance_id,
        "target_hospital_id": emergency.target_hospital_id
    })

    return emergency

@router.post("/{emergency_id}/override", response_model=EmergencyResponse)
async def dispatcher_override(
    emergency_id: int,
    req: DispatchOverrideRequest,
    db: Session = Depends(get_db)
):
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    amb = db.query(Ambulance).filter(Ambulance.id == req.ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Selected ambulance not found")

    emergency.assigned_ambulance_id = amb.id
    if req.hospital_id:
        emergency.target_hospital_id = req.hospital_id
        
    emergency.is_dispatcher_override = True
    emergency.override_reason = req.override_reason
    emergency.status = "DISPATCHED"
    emergency.dispatched_at = datetime.now(timezone.utc)
    amb.status = "DISPATCHED"

    db.commit()
    db.refresh(emergency)

    log = DispatchLog(
        emergency_id=emergency.id,
        action="DISPATCH_OVERRIDDEN",
        actor_role="DISPATCHER",
        description=f"Dispatcher manually assigned Ambulance {amb.callsign}. Reason: {req.override_reason}"
    )
    db.add(log)
    db.commit()

    await ws_manager.broadcast({
        "type": "DISPATCH_OVERRIDE_EXECUTED",
        "emergency_id": emergency.id,
        "ambulance_callsign": amb.callsign,
        "override_reason": req.override_reason
    })

    return emergency

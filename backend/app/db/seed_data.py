from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models.user import User
from app.models.ambulance import Ambulance
from app.models.hospital import Hospital
from app.models.emergency import Emergency
from app.models.log import DispatchLog
from app.core.security import get_password_hash
from app.services.ai_classifier import classify_emergency

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        print("Database already contains data. Skipping seed.")
        return

    print("Seeding database with demo users, ambulances, hospitals, and emergencies...")

    # 1. Create Users
    password_hash = get_password_hash("password123")

    caller_user = User(
        email="caller@emergency.net",
        hashed_password=password_hash,
        full_name="Sarah Jenkins",
        role="CALLER",
        phone="+1 (555) 019-2831"
    )
    
    driver1_user = User(
        email="driver1@dispatch.net",
        hashed_password=password_hash,
        full_name="Marcus Vance (Paramedic Lead)",
        role="DRIVER",
        phone="+1 (555) 014-9922"
    )
    
    driver2_user = User(
        email="driver2@dispatch.net",
        hashed_password=password_hash,
        full_name="Elena Rostova (ALS Paramedic)",
        role="DRIVER",
        phone="+1 (555) 018-3321"
    )
    
    hospital_user = User(
        email="hospital1@metrohealth.org",
        hashed_password=password_hash,
        full_name="Dr. Robert Chen (ER Director)",
        role="HOSPITAL",
        phone="+1 (555) 012-7711"
    )

    dispatcher_user = User(
        email="dispatcher@controlcenter.gov",
        hashed_password=password_hash,
        full_name="Commander James Sterling",
        role="DISPATCHER",
        phone="+1 (555) 010-0000"
    )

    db.add_all([caller_user, driver1_user, driver2_user, hospital_user, dispatcher_user])
    db.commit()
    db.refresh(driver1_user)
    db.refresh(driver2_user)

    # 2. Create Ambulances
    # Base location centered around NYC coordinates (40.7128, -74.0060)
    ambulances = [
        Ambulance(
            callsign="AMB-101 (MICU)",
            vehicle_number="NY-MED-901",
            type="MICU",
            status="AVAILABLE",
            latitude=40.7180,
            longitude=-74.0010,
            equipment=["Defibrillator", "Ventilator", "Suction", "Oxygen", "Trauma Kit", "Infusion Pump", "Pediatric Resuscitation Kit"],
            driver_name="Marcus Vance",
            driver_phone="+1 (555) 014-9922",
            driver_user_id=driver1_user.id,
            trips_today=2
        ),
        Ambulance(
            callsign="AMB-102 (ALS)",
            vehicle_number="NY-MED-442",
            type="ALS",
            status="AVAILABLE",
            latitude=40.7290,
            longitude=-73.9920,
            equipment=["Defibrillator", "Oxygen", "Trauma Kit", "BVM", "Suction"],
            driver_name="Elena Rostova",
            driver_phone="+1 (555) 018-3321",
            driver_user_id=driver2_user.id,
            trips_today=1
        ),
        Ambulance(
            callsign="AMB-103 (ALS)",
            vehicle_number="NY-MED-312",
            type="ALS",
            status="AVAILABLE",
            latitude=40.7050,
            longitude=-74.0120,
            equipment=["Defibrillator", "Oxygen", "Trauma Kit", "BVM"],
            driver_name="David Miller",
            driver_phone="+1 (555) 017-8822",
            trips_today=3
        ),
        Ambulance(
            callsign="AMB-104 (BLS)",
            vehicle_number="NY-MED-108",
            type="BLS",
            status="AVAILABLE",
            latitude=40.7350,
            longitude=-73.9810,
            equipment=["Oxygen", "Trauma Kit", "BVM", "Burn Sheet"],
            driver_name="Rachel Adams",
            driver_phone="+1 (555) 016-5544",
            trips_today=0
        ),
        Ambulance(
            callsign="AMB-105 (MICU)",
            vehicle_number="NY-MED-770",
            type="MICU",
            status="MAINTENANCE",
            latitude=40.7500,
            longitude=-73.9700,
            equipment=["Defibrillator", "Ventilator", "Oxygen", "Trauma Kit", "Heavy Duty Stretcher"],
            driver_name="Tom Harris",
            driver_phone="+1 (555) 011-2233",
            trips_today=0
        ),
    ]
    db.add_all(ambulances)
    db.commit()

    # 3. Create Hospitals
    hospitals = [
        Hospital(
            name="Metro General Level-1 Trauma Hospital",
            address="450 1st Avenue, Manhattan, NY",
            latitude=40.7380,
            longitude=-73.9770,
            trauma_level="Level 1 Comprehensive Trauma Center",
            total_er_beds=40,
            available_er_beds=14,
            total_icu_beds=15,
            available_icu_beds=5,
            er_status="OPEN",
            specialties=["Cardiology", "Neurology", "Severe Trauma", "Burn Unit"],
            contact_number="+1 (212) 555-0100"
        ),
        Hospital(
            name="St. Jude Heart & Emergency Medical Center",
            address="120 W 14th St, New York, NY",
            latitude=40.7370,
            longitude=-73.9970,
            trauma_level="Level 2 Regional Trauma Center",
            total_er_beds=25,
            available_er_beds=6,
            total_icu_beds=10,
            available_icu_beds=2,
            er_status="OPEN",
            specialties=["Cardiology", "Stroke Center", "Orthopedics"],
            contact_number="+1 (212) 555-0200"
        ),
        Hospital(
            name="City Children & Pediatric Emergency Hospital",
            address="330 E 38th St, New York, NY",
            latitude=40.7470,
            longitude=-73.9720,
            trauma_level="Pediatric Specialty Center",
            total_er_beds=20,
            available_er_beds=3,
            total_icu_beds=8,
            available_icu_beds=1,
            er_status="BUSY",
            specialties=["Pediatrics", "Neonatal ICU", "Child Trauma"],
            contact_number="+1 (212) 555-0300"
        ),
        Hospital(
            name="Memorial West Community Hospital",
            address="50 Hudson Yards, New York, NY",
            latitude=40.7530,
            longitude=-74.0020,
            trauma_level="Level 3 Community Hospital",
            total_er_beds=18,
            available_er_beds=0,
            total_icu_beds=4,
            available_icu_beds=0,
            er_status="DIVERSION",
            specialties=["General ER", "Urgent Care"],
            contact_number="+1 (212) 555-0400"
        )
    ]
    db.add_all(hospitals)
    db.commit()

    # 4. Seed Emergencies (Active & Historical for Analytics)
    now = datetime.now(timezone.utc)

    # Active Pending Emergency 1
    triage1 = classify_emergency("Cardiac", "Elderly patient collapsed, severe chest pressure, gasping for air", 1, ["Oxygen Needed"])
    e1 = Emergency(
        caller_name="Sarah Jenkins",
        caller_phone="+1 (555) 019-2831",
        address="350 5th Ave (Empire State Bldg area), NY",
        latitude=40.7484,
        longitude=-73.9857,
        emergency_type="Cardiac",
        symptoms="Elderly patient collapsed, severe chest pressure, gasping for air",
        patient_count=1,
        special_requirements=["Oxygen Needed"],
        priority=triage1["priority"],
        ai_severity_score=triage1["ai_severity_score"],
        ai_recommended_type=triage1["ai_recommended_type"],
        ai_required_equipment=triage1["ai_required_equipment"],
        ai_urgency_reason=triage1["ai_urgency_reason"],
        status="PENDING",
        created_at=now - timedelta(minutes=4)
    )

    # Active Dispatched Emergency 2
    triage2 = classify_emergency("Trauma", "Multi-vehicle collision on highway ramp. 2 casualties with deep cuts.", 2, ["Bariatric"])
    amb1 = db.query(Ambulance).filter_by(callsign="AMB-101 (MICU)").first()
    hosp1 = db.query(Hospital).filter_by(name="Metro General Level-1 Trauma Hospital").first()
    
    e2 = Emergency(
        caller_name="Officer Bob Rodriguez",
        caller_phone="+1 (555) 013-4411",
        address="West Side Hwy & W 23rd St, NY",
        latitude=40.7490,
        longitude=-74.0080,
        emergency_type="Trauma",
        symptoms="Multi-vehicle collision on highway ramp. 2 casualties with deep cuts.",
        patient_count=2,
        special_requirements=["Bariatric"],
        priority=triage2["priority"],
        ai_severity_score=triage2["ai_severity_score"],
        ai_recommended_type=triage2["ai_recommended_type"],
        ai_required_equipment=triage2["ai_required_equipment"],
        ai_urgency_reason=triage2["ai_urgency_reason"],
        status="EN_ROUTE",
        assigned_ambulance_id=amb1.id if amb1 else None,
        target_hospital_id=hosp1.id if hosp1 else None,
        created_at=now - timedelta(minutes=12),
        dispatched_at=now - timedelta(minutes=10)
    )
    if amb1:
        amb1.status = "DISPATCHED"

    # Historical Resolved Emergency 3
    triage3 = classify_emergency("Respiratory", "Severe asthma attack, blue lips, wheezing heavily", 1, ["Oxygen Needed", "Ventilator Needed"])
    e3 = Emergency(
        caller_name="Michael Scott",
        caller_phone="+1 (555) 018-9900",
        address="100 Wall St, New York, NY",
        latitude=40.7060,
        longitude=-74.0090,
        emergency_type="Respiratory",
        symptoms="Severe asthma attack, blue lips, wheezing heavily",
        patient_count=1,
        special_requirements=["Oxygen Needed", "Ventilator Needed"],
        priority=triage3["priority"],
        ai_severity_score=triage3["ai_severity_score"],
        ai_recommended_type=triage3["ai_recommended_type"],
        ai_required_equipment=triage3["ai_required_equipment"],
        ai_urgency_reason=triage3["ai_urgency_reason"],
        status="RESOLVED",
        created_at=now - timedelta(hours=2),
        dispatched_at=now - timedelta(hours=1, minutes=58),
        arrived_scene_at=now - timedelta(hours=1, minutes=50),
        arrived_hospital_at=now - timedelta(hours=1, minutes=30),
        resolved_at=now - timedelta(hours=1)
    )

    # Historical Resolved Emergency 4
    triage4 = classify_emergency("Stroke", "Sudden facial drooping, arm weakness, slurred speech", 1, [])
    e4 = Emergency(
        caller_name="Alice Cooper",
        caller_phone="+1 (555) 012-3344",
        address="200 Park Ave, New York, NY",
        latitude=40.7535,
        longitude=-73.9765,
        emergency_type="Stroke",
        symptoms="Sudden facial drooping, arm weakness, slurred speech",
        patient_count=1,
        special_requirements=[],
        priority=triage4["priority"],
        ai_severity_score=triage4["ai_severity_score"],
        ai_recommended_type=triage4["ai_recommended_type"],
        ai_required_equipment=triage4["ai_required_equipment"],
        ai_urgency_reason=triage4["ai_urgency_reason"],
        status="RESOLVED",
        created_at=now - timedelta(hours=5),
        dispatched_at=now - timedelta(hours=4, minutes=58),
        arrived_scene_at=now - timedelta(hours=4, minutes=49),
        arrived_hospital_at=now - timedelta(hours=4, minutes=25),
        resolved_at=now - timedelta(hours=3, minutes=50)
    )

    db.add_all([e1, e2, e3, e4])
    db.commit()

    print("Seed process completed successfully!")

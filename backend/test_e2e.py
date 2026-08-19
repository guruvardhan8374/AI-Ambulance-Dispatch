import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("=== STARTING RESPONSAI E2E API VERIFICATION TESTS ===")
    
    # 1. Registration
    reg_email = f"testuser_{int(time.time())}@emergency.net"
    reg_payload = {
        "email": reg_email,
        "password": "password123",
        "full_name": "Test Dr. Alex Rivera",
        "role": "DRIVER",
        "phone": "+1 (555) 999-8877"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    print(f"1. Registration status: {r.status_code}")
    assert r.status_code == 200, f"Registration failed: {r.text}"
    user_data = r.json()
    print(f"   Registered user ID: {user_data['id']}, Role: {user_data['role']}")

    # 2. Login
    login_payload = {
        "email": reg_email,
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    print(f"2. Login status: {r.status_code}")
    assert r.status_code == 200, f"Login failed: {r.text}"
    token_data = r.json()
    token = token_data["access_token"]
    print(f"   JWT Access Token acquired ({token[:20]}...)")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get Me
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"3. Get Me status: {r.status_code}")
    assert r.status_code == 200, f"Get me failed: {r.text}"

    # 4. Create Emergency SOS
    em_payload = {
        "caller_name": "Test Patient John",
        "caller_phone": "+1 (555) 333-2211",
        "address": "700 Fifth Ave, New York, NY",
        "latitude": 40.7614,
        "longitude": -73.9776,
        "emergency_type": "Cardiac",
        "symptoms": "Severe acute chest pain, radiating down left arm, cold sweat",
        "patient_count": 1,
        "special_requirements": ["Oxygen Needed", "Ventilator Needed"]
    }
    r = requests.post(f"{BASE_URL}/emergencies/", json=em_payload, headers=headers)
    print(f"4. Create Emergency status: {r.status_code}")
    assert r.status_code == 200, f"Create emergency failed: {r.text}"
    em = r.json()
    em_id = em["id"]
    print(f"   Created Emergency #{em_id} - Priority: {em['priority']}, Severity Score: {em['ai_severity_score']}, Rec Vehicle: {em['ai_recommended_type']}")
    assert em["priority"] == "CRITICAL", f"Expected CRITICAL priority, got {em['priority']}"

    # 5. AI Ambulance Recommendations
    r = requests.get(f"{BASE_URL}/dispatch/recommend-ambulances/{em_id}")
    print(f"5. AI Ambulance Recommendation status: {r.status_code}")
    assert r.status_code == 200, f"Ambulance recommendation failed: {r.text}"
    amb_recs = r.json()
    print(f"   Found {len(amb_recs)} recommended ambulances.")
    assert len(amb_recs) > 0, "No recommended ambulances returned!"
    top_amb = amb_recs[0]
    print(f"   Top Pick: {top_amb['ambulance']['callsign']} ({top_amb['match_score']}% Match, {top_amb['distance_km']} km away)")

    # 6. AI Hospital Recommendations
    r = requests.get(f"{BASE_URL}/dispatch/recommend-hospitals/{em_id}")
    print(f"6. AI Hospital Recommendation status: {r.status_code}")
    assert r.status_code == 200, f"Hospital recommendation failed: {r.text}"
    hosp_recs = r.json()
    top_hosp = hosp_recs[0]
    print(f"   Top Pick Hospital: {top_hosp['hospital']['name']} ({top_hosp['suitability_score']}% Suitability)")

    # 7. Dispatcher Manual Override Test
    override_payload = {
        "ambulance_id": top_amb['ambulance']['id'],
        "hospital_id": top_hosp['hospital']['id'],
        "override_reason": "Automated E2E Manual Override Test Verification"
    }
    r = requests.post(f"{BASE_URL}/emergencies/{em_id}/override", json=override_payload, headers=headers)
    print(f"7. Dispatcher Override status: {r.status_code}")
    assert r.status_code == 200, f"Override failed: {r.text}"
    em_overridden = r.json()
    assert em_overridden["is_dispatcher_override"] == True

    # 8. Workflow Progression: EN_ROUTE -> ON_SCENE -> TRANSPORTING -> ARRIVED_HOSPITAL -> RESOLVED
    workflow_steps = ["EN_ROUTE", "ON_SCENE", "TRANSPORTING", "ARRIVED_HOSPITAL", "RESOLVED"]
    for step in workflow_steps:
        status_payload = {
            "status": step,
            "assigned_ambulance_id": top_amb['ambulance']['id'],
            "target_hospital_id": top_hosp['hospital']['id']
        }
        r = requests.patch(f"{BASE_URL}/emergencies/{em_id}/status", json=status_payload, headers=headers)
        print(f"8. Status Transition to {step}: {r.status_code}")
        assert r.status_code == 200, f"Status transition to {step} failed: {r.text}"

    # 9. Ambulance GPS Location update
    loc_payload = {"latitude": 40.7620, "longitude": -73.9780}
    r = requests.patch(f"{BASE_URL}/ambulances/{top_amb['ambulance']['id']}/location", json=loc_payload, headers=headers)
    print(f"9. Ambulance Location update: {r.status_code}")
    assert r.status_code == 200

    # 10. Hospital Capacity update
    hosp_payload = {"available_er_beds": 10, "available_icu_beds": 3, "er_status": "OPEN"}
    r = requests.patch(f"{BASE_URL}/hospitals/{top_hosp['hospital']['id']}", json=hosp_payload, headers=headers)
    print(f"10. Hospital Capacity update: {r.status_code}")
    assert r.status_code == 200

    # 11. Analytics Overview
    r = requests.get(f"{BASE_URL}/analytics/overview")
    print(f"11. Analytics Overview: {r.status_code}")
    assert r.status_code == 200
    analytics = r.json()
    print(f"    Total Emergencies: {analytics['total_emergencies']}, Active: {analytics['active_emergencies']}, Avg Response: {analytics['avg_response_time_minutes']} mins")

    print("\n[SUCCESS] ALL 11 API TEST SUITE VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()

import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def login_user(email, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed for {email}: {r.text}"
    return r.json()

def run_role_tests():
    print("==================================================================")
    print(" RESPONSAI 4-ROLE DASHBOARDS & RBAC SECURITY VERIFICATION SUITE")
    print("==================================================================")

    # 1. Test Login & Role for all 4 Accounts
    print("\n--- 1. Testing Role Logins ---")
    
    caller_auth = login_user("caller@emergency.net", "password123")
    print(f"[PASS] CALLER logged in: {caller_auth['full_name']} | Role: {caller_auth['role']}")
    assert caller_auth["role"] == "CALLER"

    driver_auth = login_user("driver1@dispatch.net", "password123")
    print(f"[PASS] DRIVER logged in: {driver_auth['full_name']} | Role: {driver_auth['role']}")
    assert driver_auth["role"] == "DRIVER"

    hospital_auth = login_user("hospital1@metrohealth.org", "password123")
    print(f"[PASS] HOSPITAL logged in: {hospital_auth['full_name']} | Role: {hospital_auth['role']}")
    assert hospital_auth["role"] == "HOSPITAL"

    dispatcher_auth = login_user("dispatcher@controlcenter.gov", "password123")
    print(f"[PASS] DISPATCHER logged in: {dispatcher_auth['full_name']} | Role: {dispatcher_auth['role']}")
    assert dispatcher_auth["role"] == "DISPATCHER"

    caller_headers = {"Authorization": f"Bearer {caller_auth['access_token']}"}
    driver_headers = {"Authorization": f"Bearer {driver_auth['access_token']}"}
    hospital_headers = {"Authorization": f"Bearer {hospital_auth['access_token']}"}
    dispatcher_headers = {"Authorization": f"Bearer {dispatcher_auth['access_token']}"}

    # 2. Test RBAC Security Permissions
    print("\n--- 2. Testing RBAC Security & 403 Forbidden Route Enforcement ---")
    
    # 2a. CALLER trying to access dispatcher analytics -> Expected 403
    r = requests.get(f"{BASE_URL}/analytics/overview", headers=caller_headers)
    print(f"CALLER requesting Dispatcher Analytics: Status {r.status_code}")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("[PASS] RBAC Enforced: CALLER blocked from Dispatcher Analytics (403 Forbidden)")

    # 2b. CALLER trying to update hospital capacity -> Expected 403
    r = requests.patch(f"{BASE_URL}/hospitals/1", json={"available_er_beds": 10}, headers=caller_headers)
    print(f"CALLER requesting Hospital Capacity update: Status {r.status_code}")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("[PASS] RBAC Enforced: CALLER blocked from Hospital Capacity updates (403 Forbidden)")

    # 2c. DRIVER trying to access AI Dispatch recommendations -> Expected 403
    r = requests.get(f"{BASE_URL}/dispatch/recommend-ambulances/1", headers=driver_headers)
    print(f"DRIVER requesting Dispatch recommendations: Status {r.status_code}")
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print("[PASS] RBAC Enforced: DRIVER blocked from Dispatch AI recommendations (403 Forbidden)")

    # 2d. HOSPITAL staff updating Hospital Capacity -> Expected 200
    r = requests.patch(f"{BASE_URL}/hospitals/1", json={"available_er_beds": 15, "er_status": "OPEN"}, headers=hospital_headers)
    print(f"HOSPITAL requesting Hospital Capacity update: Status {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    print("[PASS] RBAC Authorized: HOSPITAL staff successfully updated Capacity (200 OK)")

    # 3. Test Full Multi-Role Workflow
    print("\n--- 3. Testing End-to-End Emergency Lifecycle Across Roles ---")

    # Step A: CALLER creates emergency
    em_payload = {
        "caller_name": "Sarah Jenkins",
        "caller_phone": "+1 (555) 019-2831",
        "address": "450 Lexington Ave, New York, NY",
        "latitude": 40.7516,
        "longitude": -73.9754,
        "emergency_type": "Cardiac",
        "symptoms": "Severe acute chest pain radiating down left arm, cold sweat",
        "patient_count": 1,
        "special_requirements": ["Oxygen Needed", "Defibrillator"]
    }
    r = requests.post(f"{BASE_URL}/emergencies/", json=em_payload, headers=caller_headers)
    assert r.status_code == 200, f"Failed creating emergency: {r.text}"
    em = r.json()
    em_id = em["id"]
    print(f"Step A [CALLER]: Created Emergency #{em_id} (AI Priority: {em['priority']}, Severity: {em['ai_severity_score']}/100)")

    # Step B: DISPATCHER receives and reviews AI recommendations
    r = requests.get(f"{BASE_URL}/dispatch/recommend-ambulances/{em_id}", headers=dispatcher_headers)
    assert r.status_code == 200, f"Failed getting amb recs: {r.text}"
    amb_recs = r.json()
    top_amb_id = amb_recs[0]["ambulance"]["id"]
    top_amb_callsign = amb_recs[0]["ambulance"]["callsign"]
    print(f"Step B [DISPATCHER]: AI Recommended Ambulance {top_amb_callsign} (Match: {amb_recs[0]['match_score']}%)")

    # Step C: DISPATCHER dispatches ambulance
    r = requests.patch(f"{BASE_URL}/emergencies/{em_id}/status", json={
        "status": "DISPATCHED",
        "assigned_ambulance_id": top_amb_id,
        "target_hospital_id": 1
    }, headers=dispatcher_headers)
    assert r.status_code == 200
    print(f"Step C [DISPATCHER]: Dispatched Ambulance ID {top_amb_id} to Emergency #{em_id}")

    # Step D: DRIVER transitions status: EN_ROUTE -> ON_SCENE -> TRANSPORTING
    for next_step in ["EN_ROUTE", "ON_SCENE", "TRANSPORTING"]:
        r = requests.patch(f"{BASE_URL}/emergencies/{em_id}/status", json={
            "status": next_step,
            "assigned_ambulance_id": top_amb_id,
            "target_hospital_id": 1
        }, headers=driver_headers)
        assert r.status_code == 200
        print(f"Step D [DRIVER]: Transitioned status -> {next_step}")

    # Step E: DRIVER simulates GPS move
    r = requests.patch(f"{BASE_URL}/ambulances/{top_amb_id}/location", json={
        "latitude": 40.7520,
        "longitude": -73.9760
    }, headers=driver_headers)
    assert r.status_code == 200
    print(f"Step E [DRIVER]: Updated GPS Telemetry location")

    # Step F: DRIVER arrives at Hospital & Completes
    for final_step in ["ARRIVED_HOSPITAL", "RESOLVED"]:
        r = requests.patch(f"{BASE_URL}/emergencies/{em_id}/status", json={
            "status": final_step,
            "assigned_ambulance_id": top_amb_id,
            "target_hospital_id": 1
        }, headers=driver_headers)
        assert r.status_code == 200
        print(f"Step F [DRIVER]: Transitioned status -> {final_step}")

    # Step G: Check logs
    r = requests.get(f"{BASE_URL}/emergencies/system/logs", headers=dispatcher_headers)
    assert r.status_code == 200
    logs = r.json()
    print(f"Step G [DISPATCHER]: Verified {len(logs)} audit trail entries generated.")

    print("\n==================================================================")
    print(" ALL 4-ROLE TESTS & RBAC PERMISSION CHECKS PASSED SUCCESSFULLY! ")
    print("==================================================================")

if __name__ == "__main__":
    run_role_tests()

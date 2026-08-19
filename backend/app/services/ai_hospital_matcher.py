from typing import List, Dict, Any
from app.models.hospital import Hospital
from app.services.ai_dispatch_optimizer import haversine_distance

def rank_hospitals(
    hospitals: List[Hospital],
    emergency_lat: float,
    emergency_lon: float,
    priority: str,
    emergency_type: str
) -> List[Dict[str, Any]]:
    """
    Ranks nearby hospitals based on proximity, trauma capability, bed/ICU availability, 
    and ER status.
    """
    recommendations = []

    for hosp in hospitals:
        dist_km = haversine_distance(hosp.latitude, hosp.longitude, emergency_lat, emergency_lon)
        eta_minutes = max(1.0, round((dist_km / 40.0) * 60.0, 1))

        # Status Score
        if hosp.er_status == "DIVERSION":
            status_score = 10.0
        elif hosp.er_status == "BUSY":
            status_score = 60.0
        else:
            status_score = 100.0

        # Bed Availability Score
        if priority in ["CRITICAL", "HIGH"]:
            bed_score = 100.0 if hosp.available_icu_beds > 0 else 30.0
        else:
            bed_score = 100.0 if hosp.available_er_beds > 0 else 40.0

        # Distance Score
        dist_score = max(0.0, 100.0 - (dist_km * 7.0))

        # Combined Suitability Score
        suitability = (dist_score * 0.40) + (status_score * 0.35) + (bed_score * 0.25)
        suitability = round(min(100.0, max(0.0, suitability)), 1)

        match_reasons = [
            f"Distance: {dist_km:.2f} km (~{eta_minutes} min ETA)",
            f"ER Status: {hosp.er_status}",
            f"Available ER Beds: {hosp.available_er_beds}/{hosp.total_er_beds}",
            f"Available ICU Beds: {hosp.available_icu_beds}/{hosp.total_icu_beds}",
            f"Capability: {hosp.trauma_level}"
        ]

        recommendations.append({
            "hospital": hosp,
            "distance_km": round(dist_km, 2),
            "eta_minutes": eta_minutes,
            "suitability_score": suitability,
            "match_reasons": match_reasons
        })

    recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
    return recommendations

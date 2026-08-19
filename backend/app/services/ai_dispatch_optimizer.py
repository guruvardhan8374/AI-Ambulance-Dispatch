import math
from typing import List, Dict, Any
from app.models.ambulance import Ambulance

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers using Haversine formula."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def rank_ambulances(
    ambulances: List[Ambulance],
    emergency_lat: float,
    emergency_lon: float,
    recommended_type: str,
    required_equipment: List[str]
) -> List[Dict[str, Any]]:
    """
    Ranks available ambulances based on proximity, vehicle type compatibility, 
    equipment match %, and current driver shift workload.
    """
    recommendations = []

    for amb in ambulances:
        # Distance calculation
        dist_km = haversine_distance(amb.latitude, amb.longitude, emergency_lat, emergency_lon)
        
        # Estimated Travel Time (assuming avg urban emergency vehicle speed of 45 km/h)
        eta_minutes = max(1.0, round((dist_km / 45.0) * 60.0, 1))

        # Distance score (100 for 0 km, dropping by 10 per km)
        dist_score = max(0.0, 100.0 - (dist_km * 8.0))

        # Vehicle Type Score
        type_weights = {"MICU": 3, "ALS": 2, "BLS": 1}
        rec_weight = type_weights.get(recommended_type, 1)
        amb_weight = type_weights.get(amb.type, 1)

        if amb.type == recommended_type:
            type_score = 100.0
        elif amb_weight > rec_weight: # Higher capability ambulance is okay
            type_score = 85.0
        else: # Lower capability
            type_score = 50.0

        # Equipment Match Percentage
        amb_eq = set(amb.equipment or [])
        req_eq = set(required_equipment or [])

        if not req_eq:
            eq_match_percent = 100.0
        else:
            matched_count = len(amb_eq.intersection(req_eq))
            eq_match_percent = round((matched_count / len(req_eq)) * 100.0, 1)

        # Shift Workload penalty (slight preference for less fatigued drivers)
        workload_score = max(50.0, 100.0 - (amb.trips_today * 5.0))

        # Total Match Score computation
        match_score = (dist_score * 0.40) + (eq_match_percent * 0.30) + (type_score * 0.20) + (workload_score * 0.10)
        match_score = round(min(100.0, max(0.0, match_score)), 1)

        # Reasons summary
        reasons = [
            f"Distance: {dist_km:.2f} km (~{eta_minutes} min ETA)",
            f"Vehicle Type: {amb.type} (Recommended: {recommended_type})",
            f"Equipment Match: {eq_match_percent:.0f}% ({len(amb_eq.intersection(req_eq))}/{len(req_eq)} items)",
            f"Driver Shift Workload: {amb.trips_today} trips completed today"
        ]

        recommendations.append({
            "ambulance": amb,
            "distance_km": round(dist_km, 2),
            "eta_minutes": eta_minutes,
            "match_score": match_score,
            "equipment_match_percent": eq_match_percent,
            "reasons": reasons
        })

    # Sort by highest match score descending
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations

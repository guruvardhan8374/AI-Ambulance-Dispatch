from typing import Dict, Any, List

def classify_emergency(
    emergency_type: str,
    symptoms: str,
    patient_count: int,
    special_requirements: List[str]
) -> Dict[str, Any]:
    """
    AI Emergency Triage Engine
    Analyzes emergency information to determine priority, required equipment, 
    recommended vehicle type, and clinical decision support details.
    """
    text = (emergency_type + " " + (symptoms or "")).lower()
    
    critical_keywords = [
        "cardiac", "heart attack", "unconscious", "not breathing", "stopped breathing", 
        "severe bleeding", "gunshot", "explosion", "amputation", "anaphylaxis", 
        "choking", "drowning", "head trauma", "cardiac arrest"
    ]
    
    high_keywords = [
        "stroke", "chest pain", "seizure", "difficulty breathing", "shortness of breath",
        "fracture", "deep laceration", "burn", "pregnancy", "labor", "high fever", 
        "uncontrollable bleeding", "fainting", "poison"
    ]
    
    medium_keywords = [
        "moderate pain", "abdominal pain", "dislocation", "fall", "asthma attack",
        "allergic reaction", "vomiting blood", "sprain", "dizziness"
    ]
    
    # Base scoring logic
    severity_score = 30.0
    priority = "LOW"
    recommended_type = "BLS"
    required_equipment = ["Oxygen", "Trauma Kit", "BVM"]
    urgency_reason = "Patient presents with low-acuity symptoms requiring basic paramedic monitoring."

    # Keyword matching
    if any(kw in text for kw in critical_keywords) or emergency_type == "Cardiac":
        severity_score = 95.0
        priority = "CRITICAL"
        recommended_type = "MICU" if "ventilator" in text or "unconscious" in text else "ALS"
        required_equipment = ["Defibrillator", "Ventilator", "Suction", "Oxygen", "Trauma Kit", "Infusion Pump"]
        urgency_reason = "CRITICAL: Immediate life-threatening condition detected. High risk of respiratory/cardiac failure. Rapid ALS/MICU intervention required."
    
    elif any(kw in text for kw in high_keywords) or emergency_type in ["Stroke", "Trauma", "Respiratory"]:
        severity_score = 78.0
        priority = "HIGH"
        recommended_type = "ALS"
        required_equipment = ["Defibrillator", "Oxygen", "Trauma Kit", "BVM", "Suction"]
        urgency_reason = "HIGH URGENCY: Potential acute organ decompensation or severe neurological/respiratory compromise. Requires ALS transport."
        
    elif any(kw in text for kw in medium_keywords) or emergency_type in ["Obstetric", "Allergic", "Burn"]:
        severity_score = 55.0
        priority = "MEDIUM"
        recommended_type = "BLS"
        required_equipment = ["Oxygen", "Trauma Kit", "Burn Sheet", "BVM"]
        urgency_reason = "MEDIUM URGENCY: Stable vital signs anticipated, but prompt emergency evaluation and stabilization needed."

    # Multi-patient escalation
    if patient_count > 2:
        severity_score = min(100.0, severity_score + 15.0)
        urgency_reason += f" (Escalated due to Mass Casualty / {patient_count} Patients involved)."
        if priority != "CRITICAL":
            priority = "HIGH"

    # Special requirements handling
    if "Pediatric" in special_requirements or "pediatric" in text:
        required_equipment.append("Pediatric Resuscitation Kit")
    if "Ventilator Needed" in special_requirements or "ventilator" in text:
        recommended_type = "MICU"
        if "Ventilator" not in required_equipment:
            required_equipment.append("Ventilator")
    if "Oxygen Needed" in special_requirements:
        if "Oxygen" not in required_equipment:
            required_equipment.append("Oxygen")
    if "Bariatric" in special_requirements:
        required_equipment.append("Heavy Duty Stretcher")

    return {
        "priority": priority,
        "ai_severity_score": round(severity_score, 1),
        "ai_recommended_type": recommended_type,
        "ai_required_equipment": list(set(required_equipment)),
        "ai_urgency_reason": urgency_reason,
        "disclaimer": "AI decision-support analysis. Medical professionals must exercise independent clinical judgment."
    }

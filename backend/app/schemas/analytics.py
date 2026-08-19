from pydantic import BaseModel
from typing import List, Dict, Any

class ResponseTimeByPriority(BaseModel):
    priority: str
    avg_response_minutes: float
    total_count: int

class CategoryCount(BaseModel):
    category: str
    count: int

class FleetUtilization(BaseModel):
    total_ambulances: int
    available: int
    dispatched: int
    on_scene: int
    transporting: int
    maintenance: int
    utilization_rate: float

class AnalyticsOverview(BaseModel):
    total_emergencies: int
    active_emergencies: int
    avg_response_time_minutes: float
    avg_dispatch_time_minutes: float
    response_by_priority: List[ResponseTimeByPriority]
    category_distribution: List[CategoryCount]
    fleet_utilization: FleetUtilization
    hospital_bed_occupancy: Dict[str, Any]

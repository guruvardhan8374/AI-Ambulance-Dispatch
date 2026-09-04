import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import { 
  Target, 
  Truck, 
  MapPin, 
  Clock, 
  Hospital, 
  CheckCircle2, 
  Activity, 
  ShieldAlert, 
  ArrowRight,
  Navigation,
  Check,
  ChevronRight
} from "lucide-react";

export const ActiveMission = () => {
  const { lastMessage } = useWebSocket();
  const [mission, setMission] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMission = async () => {
    try {
      const [emergencies, ambulances, hospitals] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);

      const active = emergencies.find(e => 
        (e.status === "DISPATCHED" || e.status === "EN_ROUTE" || e.status === "ON_SCENE" || e.status === "TRANSPORTING" || e.status === "ARRIVED_HOSPITAL")
      ) || emergencies[0] || null;

      setMission(active);

      if (active?.assigned_ambulance_id) {
        setAmbulance(ambulances.find(a => a.id === active.assigned_ambulance_id) || ambulances[0]);
      } else {
        setAmbulance(ambulances[0]);
      }

      if (active?.target_hospital_id) {
        setHospital(hospitals.find(h => h.id === active.target_hospital_id) || hospitals[0]);
      } else {
        setHospital(hospitals[0]);
      }
    } catch (err) {
      console.error("Mission error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMission();
  }, [lastMessage]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!mission) return;
    setActionLoading(true);
    try {
      await api.updateEmergencyStatus(mission.id, {
        status: nextStatus,
        assigned_ambulance_id: ambulance?.id,
        target_hospital_id: mission.target_hospital_id || hospital?.id
      });
      await fetchMission();
    } catch (err) {
      alert(err.message || "Failed to update mission status");
    } finally {
      setActionLoading(false);
    }
  };

  const statusSequence = [
    { key: "DISPATCHED", label: "Accept Mission", next: "EN_ROUTE" },
    { key: "EN_ROUTE", label: "Arrived On Scene", next: "ON_SCENE" },
    { key: "ON_SCENE", label: "Begin Patient Transport", next: "TRANSPORTING" },
    { key: "TRANSPORTING", label: "Arrived at Hospital ER", next: "ARRIVED_HOSPITAL" },
    { key: "ARRIVED_HOSPITAL", label: "Complete & Return to Ready", next: "RESOLVED" },
  ];

  const currentStepObj = statusSequence.find(s => s.key === mission?.status) || statusSequence[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Paramedic Field Action Plan</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Active Emergency Mission Details
          </h1>
          <p className="text-xs text-slate-400">
            Assigned call information, patient triage criteria, and sequential field commands.
          </p>
        </div>

        <Link
          to="/driver/navigation"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Navigation className="w-4 h-4" />
          <span>Launch GPS Navigation</span>
        </Link>
      </div>

      {mission ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Mission Overview Banner */}
            <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold text-slate-400">MISSION #{mission.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    mission.priority === "CRITICAL"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}>
                    {mission.priority} PRIORITY
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                  STATUS: {mission.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Incident Type</span>
                  <p className="text-base font-bold text-white">{mission.emergency_type} Emergency</p>
                  <p className="text-xs text-slate-400">{mission.symptoms || "Critical symptoms"}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pickup Address</span>
                  <p className="text-sm font-bold text-white">{mission.address}</p>
                  <p className="text-xs text-rose-400 font-medium">Caller: {mission.caller_name} ({mission.caller_phone})</p>
                </div>
              </div>

              {/* Action Buttons Sequence */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={actionLoading || mission.status === "RESOLVED"}
                  onClick={() => handleUpdateStatus(currentStepObj.next)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-600/30 transition uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Truck className="w-5 h-5" />
                  <span>ACTION: {currentStepObj.label}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tactical Map */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Mission Route Tracking</span>
                <span className="text-xs text-emerald-400 font-mono">Live GPS Sync</span>
              </div>
              <div className="h-80 w-full">
                <LiveMap
                  emergencies={[mission]}
                  ambulances={ambulance ? [ambulance] : []}
                  hospitals={hospital ? [hospital] : []}
                  centerLat={mission.latitude}
                  centerLng={mission.longitude}
                />
              </div>
            </div>

          </div>

          {/* Right Sidebar Details */}
          <div className="space-y-4">
            
            {/* Clinical & AI Requirements */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                <Activity className="w-4 h-4" />
                <span>AI Clinical Assessment</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Severity Score</span>
                  <span className="text-xl font-black text-rose-400">{mission.ai_severity_score || 88}/100</span>
                  <p className="text-[11px] text-slate-400 mt-1">{mission.ai_urgency_reason}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Ambulance</span>
                  <span className="text-sm font-bold text-emerald-400">{mission.ai_recommended_type || "ALS / MICU"}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Required Equipment</span>
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {(mission.ai_required_equipment || ["Oxygen", "Defibrillator", "Ventilator"]).map((eq, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[10px] font-semibold border border-slate-700">
                        ✓ {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Receiving Hospital Facility */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold">
                <Hospital className="w-4 h-4" />
                <span>Destination Hospital ER</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-white">{hospital?.name}</p>
                <p className="text-[11px] text-slate-400">{hospital?.address}</p>
                <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                  ER Status: {hospital?.er_status || "OPEN"} | Available ER Beds: {hospital?.available_er_beds || 8}
                </p>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          No active emergency mission assigned at this time.
        </div>
      )}

    </div>
  );
};

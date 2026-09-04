import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import { 
  Siren, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  HeartPulse,
  Hospital
} from "lucide-react";

export const CallerDashboard = () => {
  const navigate = useNavigate();
  const { lastMessage } = useWebSocket();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [assignedAmbulance, setAssignedAmbulance] = useState(null);
  const [targetHospital, setTargetHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    try {
      const emergencies = await api.getEmergencies();
      // Find latest unresolved emergency or newest
      const active = emergencies.find(e => e.status !== "RESOLVED" && e.status !== "CANCELLED") || emergencies[0] || null;
      setActiveEmergency(active);

      if (active?.assigned_ambulance_id) {
        const ambulances = await api.getAmbulances();
        const amb = ambulances.find(a => a.id === active.assigned_ambulance_id);
        setAssignedAmbulance(amb || null);
      } else {
        setAssignedAmbulance(null);
      }

      if (active?.target_hospital_id) {
        const hospitals = await api.getHospitals();
        const hosp = hospitals.find(h => h.id === active.target_hospital_id);
        setTargetHospital(hosp || null);
      } else {
        setTargetHospital(null);
      }
    } catch (err) {
      console.error("Error loading caller dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, [lastMessage]);

  const timelineSteps = [
    { key: "PENDING", label: "Emergency Created" },
    { key: "AI_TRIAGE", label: "AI Assessment" },
    { key: "DISPATCHED", label: "Ambulance Assigned" },
    { key: "EN_ROUTE", label: "En Route" },
    { key: "ON_SCENE", label: "On Scene" },
    { key: "TRANSPORTING", label: "Transporting" },
    { key: "ARRIVED_HOSPITAL", label: "At Hospital" },
    { key: "RESOLVED", label: "Resolved" },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case "PENDING": return 1;
      case "DISPATCHED": return 2;
      case "EN_ROUTE": return 3;
      case "ON_SCENE": return 4;
      case "TRANSPORTING": return 5;
      case "ARRIVED_HOSPITAL": return 6;
      case "RESOLVED": return 7;
      default: return 0;
    }
  };

  const currentStep = activeEmergency ? getStepIndex(activeEmergency.status) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & SOS Hero Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>24/7 AI-Enhanced Emergency Response</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Need Immediate Medical Assistance?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Our AI instantly evaluates your condition, determines required medical equipment, and dispatches the nearest advanced life support ambulance within seconds.
          </p>

          <div className="pt-2">
            <Link
              to="/caller/request"
              className="inline-flex items-center space-x-3 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-black rounded-2xl shadow-xl shadow-rose-600/30 transition transform active:scale-95 cursor-pointer uppercase tracking-wider animate-pulse"
            >
              <Siren className="w-5 h-5" />
              <span>🚨 REQUEST EMERGENCY (SOS)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="absolute right-4 bottom-4 opacity-10 hidden lg:block pointer-events-none">
          <Siren className="w-64 h-64 text-rose-500" />
        </div>
      </div>

      {/* Active Emergency Status Card */}
      {activeEmergency && activeEmergency.status !== "RESOLVED" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-slate-400">
                  INCIDENT #{activeEmergency.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  activeEmergency.priority === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : activeEmergency.priority === "HIGH"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                }`}>
                  {activeEmergency.priority} PRIORITY
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {activeEmergency.status}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                {activeEmergency.emergency_type} Emergency
              </h2>
            </div>

            <Link
              to="/caller/tracking"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <MapPin className="w-4 h-4" />
              <span>Open Live Tracking Map</span>
            </Link>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* AI Triage Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                <HeartPulse className="w-4 h-4" />
                <span>AI Severity Score</span>
              </div>
              <p className="text-2xl font-black text-white">
                {activeEmergency.ai_severity_score || 85}<span className="text-xs text-slate-400 font-normal">/100</span>
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {activeEmergency.ai_urgency_reason || "Immediate clinical intervention required."}
              </p>
            </div>

            {/* Assigned Ambulance */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold">
                <Truck className="w-4 h-4" />
                <span>Assigned Unit</span>
              </div>
              <p className="text-base font-black text-white">
                {assignedAmbulance ? assignedAmbulance.callsign : "Dispatching Unit..."}
              </p>
              <p className="text-[11px] text-slate-400">
                Driver: <span className="text-slate-200 font-medium">{assignedAmbulance?.driver_name || "Assigned Paramedic"}</span>
              </p>
            </div>

            {/* Target Hospital */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold">
                <Hospital className="w-4 h-4" />
                <span>Receiving Hospital</span>
              </div>
              <p className="text-sm font-bold text-white truncate">
                {targetHospital ? targetHospital.name : "Metro General Trauma"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Status: <span className="text-emerald-400 font-bold">{targetHospital?.er_status || "OPEN"}</span>
              </p>
            </div>

            {/* Location & ETA */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>Estimated ETA</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {activeEmergency.status === "ON_SCENE" ? "ON SCENE" : activeEmergency.status === "ARRIVED_HOSPITAL" ? "AT HOSPITAL" : "4-6 Mins"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {activeEmergency.address}
              </p>
            </div>

          </div>

          {/* Emergency Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Emergency Lifecycle Progress
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {timelineSteps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                      isCurrent
                        ? "bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-500/20"
                        : isPassed
                        ? "bg-slate-950 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-950/40 border-slate-800 text-slate-600"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isPassed ? "text-emerald-400" : "text-slate-700"}`} />
                    <span className={`text-[11px] font-bold ${isPassed ? "text-white" : "text-slate-500"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Live Map Preview */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Live GPS Location Tracking
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                <span>Live Telemetry</span>
              </span>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
              <LiveMap 
                emergencies={[activeEmergency]} 
                ambulances={assignedAmbulance ? [assignedAmbulance] : []}
                hospitals={targetHospital ? [targetHospital] : []}
                centerLat={activeEmergency.latitude}
                centerLng={activeEmergency.longitude}
              />
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">No Active Emergencies</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You do not have any pending emergency dispatches. If you or someone around you requires emergency assistance, trigger an SOS immediately.
            </p>
          </div>
          <Link
            to="/caller/request"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
          >
            <Siren className="w-4 h-4" />
            <span>Create New SOS Request</span>
          </Link>
        </div>
      )}

    </div>
  );
};

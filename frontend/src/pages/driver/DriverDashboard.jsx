import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import { 
  Truck, 
  Target, 
  MapPin, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  Hospital, 
  ChevronRight, 
  Activity, 
  Radio, 
  Play, 
  RotateCcw,
  ShieldAlert
} from "lucide-react";

export const DriverDashboard = () => {
  const { lastMessage } = useWebSocket();
  const [ambulances, setAmbulances] = useState([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDriverData = async () => {
    try {
      const [ambData, emergData, hospData] = await Promise.all([
        api.getAmbulances(),
        api.getEmergencies(),
        api.getHospitals()
      ]);

      setAmbulances(ambData);
      setHospitals(hospData);

      // Select first ambulance if not already selected
      const currentAmbId = selectedAmbulanceId || (ambData[0] ? ambData[0].id : null);
      if (!selectedAmbulanceId && ambData[0]) {
        setSelectedAmbulanceId(ambData[0].id);
      }

      // Find emergency assigned to this ambulance or dispatched
      const assigned = emergData.find(e => 
        (e.assigned_ambulance_id === currentAmbId || (!e.assigned_ambulance_id && e.status === "DISPATCHED")) &&
        e.status !== "RESOLVED" && e.status !== "CANCELLED"
      ) || emergData.find(e => e.status === "DISPATCHED" || e.status === "EN_ROUTE" || e.status === "ON_SCENE" || e.status === "TRANSPORTING");

      setActiveEmergency(assigned || null);
    } catch (err) {
      console.error("Driver data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, [lastMessage, selectedAmbulanceId]);

  const currentAmbulance = ambulances.find(a => a.id === selectedAmbulanceId) || ambulances[0];
  const targetHospital = hospitals.find(h => h.id === activeEmergency?.target_hospital_id) || hospitals[0];

  // Handle Sequential Status Update Sequence
  // Sequence: DISPATCHED / PENDING -> ACCEPT -> EN_ROUTE -> ON_SCENE -> TRANSPORTING -> ARRIVED_HOSPITAL -> RESOLVED
  const handleNextStatus = async () => {
    if (!activeEmergency) return;
    setActionLoading(true);

    let nextStatus = "DISPATCHED";
    const current = activeEmergency.status;

    if (current === "PENDING" || current === "DISPATCHED") {
      nextStatus = "EN_ROUTE";
    } else if (current === "EN_ROUTE") {
      nextStatus = "ON_SCENE";
    } else if (current === "ON_SCENE") {
      nextStatus = "TRANSPORTING";
    } else if (current === "TRANSPORTING") {
      nextStatus = "ARRIVED_HOSPITAL";
    } else if (current === "ARRIVED_HOSPITAL") {
      nextStatus = "RESOLVED";
    }

    try {
      await api.updateEmergencyStatus(activeEmergency.id, {
        status: nextStatus,
        assigned_ambulance_id: currentAmbulance?.id,
        target_hospital_id: activeEmergency.target_hospital_id || targetHospital?.id
      });
      await fetchDriverData();
    } catch (err) {
      console.error("Status update error:", err);
      alert(err.message || "Failed to update mission status");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusButtonText = (status) => {
    switch (status) {
      case "PENDING":
      case "DISPATCHED":
        return "ACCEPT CALL & GO EN ROUTE";
      case "EN_ROUTE":
        return "MARK ON SCENE (ARRIVED)";
      case "ON_SCENE":
        return "START PATIENT TRANSPORT";
      case "TRANSPORTING":
        return "ARRIVED AT HOSPITAL ER";
      case "ARRIVED_HOSPITAL":
        return "COMPLETE MISSION & BECOME AVAILABLE";
      default:
        return "MISSION COMPLETED";
    }
  };

  // GPS Simulation towards emergency or hospital
  const handleSimulateGPS = async () => {
    if (!currentAmbulance || !activeEmergency) return;
    try {
      const isHeadingToHospital = activeEmergency.status === "TRANSPORTING";
      const targetLat = isHeadingToHospital && targetHospital ? targetHospital.latitude : activeEmergency.latitude;
      const targetLng = isHeadingToHospital && targetHospital ? targetHospital.longitude : activeEmergency.longitude;

      // Nudge 40% closer to target
      const newLat = Number((currentAmbulance.latitude + (targetLat - currentAmbulance.latitude) * 0.4).toFixed(6));
      const newLng = Number((currentAmbulance.longitude + (targetLng - currentAmbulance.longitude) * 0.4).toFixed(6));

      await api.updateAmbulanceLocation(currentAmbulance.id, {
        latitude: newLat,
        longitude: newLng
      });
    } catch (err) {
      console.error("GPS simulation error:", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Field Unit Selector & Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Paramedic Mobile Unit Console</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Unit Telemetry & Mission Control
          </h1>
          <p className="text-xs text-slate-400">
            Assigned Vehicle: <span className="font-bold text-white">{currentAmbulance?.callsign}</span> ({currentAmbulance?.type})
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Active Unit:
          </label>
          <select
            value={selectedAmbulanceId || ""}
            onChange={(e) => setSelectedAmbulanceId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2.5 outline-none cursor-pointer"
          >
            {ambulances.map((amb) => (
              <option key={amb.id} value={amb.id}>
                {amb.callsign} — {amb.type} ({amb.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unit Call Sign</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-black text-white">{currentAmbulance?.callsign || "AMB-101"}</p>
          <p className="text-[11px] text-slate-400 font-mono">{currentAmbulance?.vehicle_number || "NY-MED-901"}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Capability / Type</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-black text-purple-300">{currentAmbulance?.type || "MICU"}</p>
          <p className="text-[11px] text-slate-400">Mobile Intensive Care Unit</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className={`text-xl font-black ${
            currentAmbulance?.status === "AVAILABLE" ? "text-emerald-400" : "text-amber-400"
          }`}>
            {currentAmbulance?.status || "AVAILABLE"}
          </p>
          <p className="text-[11px] text-slate-400">Radio & GPS Sync: Active</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trips Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white">{currentAmbulance?.trips_today || 0}</p>
          <p className="text-[11px] text-slate-400">Shift Performance: On Schedule</p>
        </div>

      </div>

      {/* Active Mission Workflow Card */}
      {activeEmergency ? (
        <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold text-blue-400">
                  ACTIVE MISSION #{activeEmergency.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  activeEmergency.priority === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}>
                  {activeEmergency.priority}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  {activeEmergency.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {activeEmergency.emergency_type} Emergency Call
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSimulateGPS}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                title="Simulate GPS movement closer to incident"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate GPS Step</span>
              </button>

              <Link
                to="/driver/navigation"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                <Navigation className="w-4 h-4" />
                <span>Open Navigation GPS</span>
              </Link>
            </div>
          </div>

          {/* Mission Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Pickup Incident Location
              </span>
              <p className="text-xs font-bold text-white line-clamp-2">
                {activeEmergency.address}
              </p>
              <p className="text-[11px] text-rose-400 font-mono">
                Caller: {activeEmergency.caller_name}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Clinical Condition / Symptoms
              </span>
              <p className="text-xs text-slate-200 line-clamp-2">
                {activeEmergency.symptoms || "Critical symptoms reported."}
              </p>
              <p className="text-[11px] text-slate-400">
                Patients: <span className="text-white font-bold">{activeEmergency.patient_count}</span>
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Designated Hospital Destination
              </span>
              <p className="text-xs font-bold text-white truncate">
                {targetHospital ? targetHospital.name : "Metro General Trauma"}
              </p>
              <p className="text-[11px] text-emerald-400 font-bold">
                Trauma ER Status: {targetHospital?.er_status || "OPEN"}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Navigation ETA & Distance
              </span>
              <p className="text-lg font-black text-emerald-400">
                {activeEmergency.status === "ON_SCENE" ? "ON SCENE" : activeEmergency.status === "ARRIVED_HOSPITAL" ? "AT HOSPITAL" : "3.2 km (4 mins)"}
              </p>
              <p className="text-[11px] text-slate-400">Route: Priority Emergency Path</p>
            </div>

          </div>

          {/* Sequential Status Progression Action */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Paramedic Mission Action Sequence
              </span>
              <span className="text-xs font-mono text-slate-500">
                Current Step: <strong className="text-blue-400">{activeEmergency.status}</strong>
              </span>
            </div>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleNextStatus}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black rounded-xl shadow-xl shadow-blue-600/30 transition uppercase tracking-wider flex items-center justify-center space-x-3 cursor-pointer"
            >
              <Truck className="w-5 h-5" />
              <span>{getStatusButtonText(activeEmergency.status)}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Map Preview */}
          <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
            <LiveMap
              emergencies={[activeEmergency]}
              ambulances={currentAmbulance ? [currentAmbulance] : []}
              hospitals={targetHospital ? [targetHospital] : []}
              centerLat={currentAmbulance?.latitude || 40.7128}
              centerLng={currentAmbulance?.longitude || -74.006}
            />
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Truck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">Unit is Standby / Available</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {currentAmbulance?.callsign} is in service and ready for AI auto-dispatch from the emergency control center.
            </p>
          </div>
          <Link
            to="/driver/calls"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <span>View Available Emergency Calls</span>
          </Link>
        </div>
      )}

      {/* Onboard Equipment Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Onboard Medical Equipment Verification ({currentAmbulance?.callsign})
        </h3>
        <div className="flex flex-wrap gap-2">
          {(currentAmbulance?.equipment || ["Defibrillator", "Ventilator", "Oxygen", "Trauma Kit", "Suction"]).map((item, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center space-x-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

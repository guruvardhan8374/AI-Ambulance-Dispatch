import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { 
  Hospital as HospitalIcon, 
  Bed, 
  Activity, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Users, 
  Plus, 
  Minus,
  Check,
  Building2
} from "lucide-react";

export const HospitalDashboard = () => {
  const { lastMessage } = useWebSocket();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Incoming accepted/rejected status state for local triage interaction
  const [acceptedCalls, setAcceptedCalls] = useState({});

  const fetchData = async () => {
    try {
      const [hospData, emergData, ambData] = await Promise.all([
        api.getHospitals(),
        api.getEmergencies(),
        api.getAmbulances()
      ]);

      setHospitals(hospData);
      setEmergencies(emergData);
      setAmbulances(ambData);

      if (!selectedHospitalId && hospData[0]) {
        setSelectedHospitalId(hospData[0].id);
      }
    } catch (err) {
      console.error("Hospital dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  // Inbound ambulances heading towards this hospital or active
  const incomingEmergencies = emergencies.filter(e => 
    (e.target_hospital_id === currentHospital?.id || !e.target_hospital_id) &&
    (e.status === "DISPATCHED" || e.status === "EN_ROUTE" || e.status === "ON_SCENE" || e.status === "TRANSPORTING" || e.status === "ARRIVED_HOSPITAL")
  );

  // Update Hospital Status (OPEN, BUSY, DIVERSION)
  const handleUpdateStatus = async (status) => {
    if (!currentHospital) return;
    setUpdating(true);
    try {
      const updated = await api.updateHospitalCapacity(currentHospital.id, {
        er_status: status
      });
      setHospitals(hospitals.map(h => h.id === updated.id ? updated : h));
    } catch (err) {
      alert(err.message || "Failed to update ER status");
    } finally {
      setUpdating(false);
    }
  };

  // Adjust Beds
  const handleAdjustBeds = async (type, delta) => {
    if (!currentHospital) return;
    const currentVal = type === "er" ? currentHospital.available_er_beds : currentHospital.available_icu_beds;
    const maxVal = type === "er" ? currentHospital.total_er_beds : currentHospital.total_icu_beds;
    const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

    setUpdating(true);
    try {
      const payload = type === "er" ? { available_er_beds: newVal } : { available_icu_beds: newVal };
      const updated = await api.updateHospitalCapacity(currentHospital.id, payload);
      setHospitals(hospitals.map(h => h.id === updated.id ? updated : h));
    } catch (err) {
      alert(err.message || "Failed to update bed capacity");
    } finally {
      setUpdating(false);
    }
  };

  const handleTriageAction = (emergencyId, action) => {
    setAcceptedCalls(prev => ({
      ...prev,
      [emergencyId]: action
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Hospital Switcher & Department Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <HospitalIcon className="w-4 h-4" />
            <span>Hospital ER Clinical Portal</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            {currentHospital?.name || "Metro General Trauma Center"}
          </h1>
          <p className="text-xs text-slate-400">
            {currentHospital?.trauma_level || "Level 1 Trauma Center"} • {currentHospital?.address}
          </p>
        </div>

        {/* Hospital Facility Switcher */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Facility:
          </label>
          <select
            value={selectedHospitalId || ""}
            onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 outline-none cursor-pointer"
          >
            {hospitals.map((hosp) => (
              <option key={hosp.id} value={hosp.id}>
                {hosp.name} ({hosp.er_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ER Operational Status & Bed Capacity Control Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ER Department Status Controller */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Dept Status</span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
              currentHospital?.er_status === "OPEN"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : currentHospital?.er_status === "BUSY"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}>
              {currentHospital?.er_status || "OPEN"}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Select emergency department intake status. Updates transmit in real-time to the Central 911 AI Dispatcher.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {["OPEN", "BUSY", "DIVERSION"].map((status) => {
              const isActive = currentHospital?.er_status === status;
              return (
                <button
                  key={status}
                  disabled={updating}
                  type="button"
                  onClick={() => handleUpdateStatus(status)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase transition border cursor-pointer ${
                    isActive
                      ? status === "OPEN"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                        : status === "BUSY"
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                        : "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* ER Beds Capacity Counter */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ER Beds Available</span>
            <Bed className="w-4 h-4 text-purple-400" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-white">
                {currentHospital?.available_er_beds}
                <span className="text-xs text-slate-500 font-normal"> / {currentHospital?.total_er_beds} Total</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time Emergency Beds</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={updating}
                type="button"
                onClick={() => handleAdjustBeds("er", -1)}
                className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                disabled={updating}
                type="button"
                onClick={() => handleAdjustBeds("er", 1)}
                className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ICU Beds Capacity Counter */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ICU Beds Available</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-rose-400">
                {currentHospital?.available_icu_beds}
                <span className="text-xs text-slate-500 font-normal"> / {currentHospital?.total_icu_beds} Total</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Critical Intensive Care Units</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={updating}
                type="button"
                onClick={() => handleAdjustBeds("icu", -1)}
                className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center transition cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                disabled={updating}
                type="button"
                onClick={() => handleAdjustBeds("icu", 1)}
                className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Hospital Capacity Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ER AVAILABLE</span>
          <p className="text-xl font-black text-emerald-400">{currentHospital?.available_er_beds} Beds</p>
          <p className="text-[10px] text-slate-400">Ready for Inbound</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ICU AVAILABLE</span>
          <p className="text-xl font-black text-rose-400">{currentHospital?.available_icu_beds} Units</p>
          <p className="text-[10px] text-slate-400">Ventilator Equipped</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">VENTILATORS</span>
          <p className="text-xl font-black text-white">8 Online</p>
          <p className="text-[10px] text-emerald-400">100% Operational</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">OXYGEN SUPPLY</span>
          <p className="text-xl font-black text-white">98% High</p>
          <p className="text-[10px] text-emerald-400">Central Reservoir Full</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">TRAUMA CAPABILITY</span>
          <p className="text-sm font-extrabold text-purple-300 truncate">Level 1 Comprehensive</p>
          <p className="text-[10px] text-slate-400">Surgical Team Standby</p>
        </div>

      </div>

      {/* Incoming Ambulances Triage List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Truck className="w-5 h-5 text-purple-400 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Incoming Inbound Ambulances ({incomingEmergencies.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-purple-400 font-bold">
            Real-Time Telemetry Feed
          </span>
        </div>

        {incomingEmergencies.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No active incoming ambulances assigned to this hospital.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {incomingEmergencies.map((e) => {
              const amb = ambulances.find(a => a.id === e.assigned_ambulance_id);
              const triageStatus = acceptedCalls[e.id];

              return (
                <div key={e.id} className="p-5 hover:bg-slate-800/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Ambulance & Incident Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                        {amb ? amb.callsign : "DISPATCHED AMBULANCE"}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        INCIDENT #{e.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        e.priority === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}>
                        {e.priority} PRIORITY
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {e.status}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white">
                      {e.emergency_type} Emergency • <span className="text-slate-400 text-xs font-normal">{e.symptoms || "Clinical condition reported"}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Patients: <strong className="text-white">{e.patient_count}</strong></span>
                      <span>Required: <strong className="text-emerald-400">{e.ai_recommended_type || "ALS"}</strong></span>
                      <span>ETA: <strong className="text-emerald-400">3 - 5 Mins</strong></span>
                    </div>
                  </div>

                  {/* Triage Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {triageStatus === "ACCEPTED" ? (
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                        <Check className="w-4 h-4" />
                        <span>BED RESERVED & ACCEPTED</span>
                      </span>
                    ) : triageStatus === "REJECTED" ? (
                      <span className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center space-x-1.5">
                        <XCircle className="w-4 h-4" />
                        <span>REVERTED TO DIVERSION</span>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTriageAction(e.id, "ACCEPTED")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                        >
                          [ ACCEPT ]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriageAction(e.id, "REJECTED")}
                          className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                        >
                          [ REJECT ]
                        </button>
                        <Link
                          to="/hospital/incoming"
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                        >
                          [ VIEW DETAILS ]
                        </Link>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

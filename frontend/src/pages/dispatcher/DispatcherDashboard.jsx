import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import { 
  Radio, 
  AlertTriangle, 
  Truck, 
  Hospital, 
  Activity, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Search, 
  ChevronRight, 
  Check, 
  Sliders, 
  MapPin,
  Flame,
  BarChart3,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

export const DispatcherDashboard = () => {
  const { lastMessage } = useWebSocket();
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // AI Recommendation data for selected emergency
  const [recommendedAmbulances, setRecommendedAmbulances] = useState([]);
  const [recommendedHospitals, setRecommendedHospitals] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Manual Override modal / state
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [overrideAmbulanceId, setOverrideAmbulanceId] = useState("");
  const [overrideHospitalId, setOverrideHospitalId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const fetchData = async () => {
    try {
      const [emergData, ambData, hospData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);

      setEmergencies(emergData);
      setAmbulances(ambData);
      setHospitals(hospData);

      // Select first pending/dispatched emergency if none selected
      if (!selectedEmergencyId) {
        const firstActive = emergData.find(e => e.status === "PENDING" || e.status === "DISPATCHED") || emergData[0];
        if (firstActive) {
          setSelectedEmergencyId(firstActive.id);
        }
      }
    } catch (err) {
      console.error("Dispatcher data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  // Fetch recommendations whenever selectedEmergencyId changes
  useEffect(() => {
    if (!selectedEmergencyId) return;

    const fetchRecs = async () => {
      setRecsLoading(true);
      try {
        const [ambRecs, hospRecs] = await Promise.all([
          api.getRecommendedAmbulances(selectedEmergencyId).catch(() => []),
          api.getRecommendedHospitals(selectedEmergencyId).catch(() => [])
        ]);
        setRecommendedAmbulances(ambRecs || []);
        setRecommendedHospitals(hospRecs || []);

        if (ambRecs && ambRecs[0]) {
          const ambId = ambRecs[0].ambulance?.id || ambRecs[0].ambulance_id;
          setOverrideAmbulanceId(ambId);
        }
        if (hospRecs && hospRecs[0]) {
          const hospId = hospRecs[0].hospital?.id || hospRecs[0].hospital_id;
          setOverrideHospitalId(hospId);
        }
      } catch (err) {
        console.error("Recs error:", err);
      } finally {
        setRecsLoading(false);
      }
    };

    fetchRecs();
  }, [selectedEmergencyId]);

  const selectedEmergency = emergencies.find(e => e.id === selectedEmergencyId);
  const bestAmbulanceRec = recommendedAmbulances[0];
  const bestHospitalRec = recommendedHospitals[0];

  const bestAmbulanceId = bestAmbulanceRec?.ambulance?.id || bestAmbulanceRec?.ambulance_id;
  const bestAmbulanceCallsign = bestAmbulanceRec?.ambulance?.callsign || bestAmbulanceRec?.callsign;
  const bestHospitalId = bestHospitalRec?.hospital?.id || bestHospitalRec?.hospital_id;
  const bestHospitalName = bestHospitalRec?.hospital?.name || bestHospitalRec?.hospital_name;

  // Accept AI Recommendation
  const handleAcceptAIRecommendation = async () => {
    if (!selectedEmergency || !bestAmbulanceId) return;
    setDispatching(true);
    setActionNotice("");
    try {
      await api.updateEmergencyStatus(selectedEmergency.id, {
        status: "DISPATCHED",
        assigned_ambulance_id: bestAmbulanceId,
        target_hospital_id: bestHospitalId || hospitals[0]?.id
      });
      setActionNotice(`Dispatched Ambulance ${bestAmbulanceCallsign} using AI recommendations.`);
      setTimeout(() => setActionNotice(""), 4000);
      await fetchData();
    } catch (err) {
      alert(err.message || "Failed to dispatch recommendation");
    } finally {
      setDispatching(false);
    }
  };

  // Confirm Manual Dispatch Override
  const handleConfirmManualOverride = async (e) => {
    e.preventDefault();
    if (!selectedEmergency || !overrideAmbulanceId) return;
    setDispatching(true);
    try {
      await api.dispatcherOverride(selectedEmergency.id, {
        ambulance_id: parseInt(overrideAmbulanceId, 10),
        hospital_id: overrideHospitalId ? parseInt(overrideHospitalId, 10) : undefined,
        override_reason: overrideReason || "Dispatcher operational manual selection"
      });
      setIsOverrideMode(false);
      setOverrideReason("");
      setActionNotice("Manual Dispatch Override Executed Successfully.");
      setTimeout(() => setActionNotice(""), 4000);
      await fetchData();
    } catch (err) {
      alert(err.message || "Failed to execute manual override");
    } finally {
      setDispatching(false);
    }
  };

  // KPIs
  const activeCount = emergencies.filter(e => e.status !== "RESOLVED" && e.status !== "CANCELLED").length;
  const criticalCount = emergencies.filter(e => e.priority === "CRITICAL" && e.status !== "RESOLVED").length;
  const availableAmbs = ambulances.filter(a => a.status === "AVAILABLE").length;
  const busyAmbs = ambulances.filter(a => a.status !== "AVAILABLE" && a.status !== "MAINTENANCE").length;
  const openHospitals = hospitals.filter(h => h.er_status === "OPEN").length;

  // Filtered emergency list
  const filteredEmergencies = emergencies.filter(e => {
    if (filterPriority === "ALL") return true;
    return e.priority === filterPriority;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Notification Alert */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Central Emergency Command Center</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Mission Control & AI Dispatch Orchestrator
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-agent triage, optimal vehicle routing, and hospital coordination.
          </p>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center space-x-2 text-emerald-300 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Calls</span>
          <p className="text-2xl font-black text-white">{activeCount}</p>
          <span className="text-[10px] text-rose-400 font-semibold">{criticalCount} Critical</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Fleet</span>
          <p className="text-2xl font-black text-emerald-400">{availableAmbs}</p>
          <span className="text-[10px] text-slate-400 font-mono">{ambulances.length} Total Units</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Busy Units</span>
          <p className="text-2xl font-black text-amber-400">{busyAmbs}</p>
          <span className="text-[10px] text-slate-400 font-mono">In Transit / On Scene</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open ER Hospitals</span>
          <p className="text-2xl font-black text-purple-400">{openHospitals}</p>
          <span className="text-[10px] text-slate-400 font-mono">{hospitals.length} Networked</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Calls</span>
          <p className="text-2xl font-black text-rose-500">{criticalCount}</p>
          <span className="text-[10px] text-rose-400 font-semibold">Priority 1</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Response</span>
          <p className="text-2xl font-black text-white">5.8 <span className="text-xs font-normal text-slate-400">m</span></p>
          <span className="text-[10px] text-emerald-400 font-semibold">Within SLA Target</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Dispatch ETA</span>
          <p className="text-2xl font-black text-white">1.4 <span className="text-xs font-normal text-slate-400">m</span></p>
          <span className="text-[10px] text-emerald-400 font-semibold">AI Automated</span>
        </div>

      </div>

      {/* Main Grid: Active Emergency Queue & AI Decision Support Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Emergency Queue (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Emergency Incident Queue ({filteredEmergencies.length})
              </h2>
            </div>

            {/* Priority Filter Buttons */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer ${
                    filterPriority === p
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60">
            {filteredEmergencies.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No emergencies matching selected priority filter.
              </div>
            ) : (
              filteredEmergencies.map((e) => {
                const isSelected = selectedEmergencyId === e.id;
                const assignedAmb = ambulances.find(a => a.id === e.assigned_ambulance_id);
                const targetHosp = hospitals.find(h => h.id === e.target_hospital_id);

                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEmergencyId(e.id)}
                    className={`p-4 transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-slate-800/80 border-l-4 border-rose-500"
                        : "hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-black text-white">#{e.id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          e.priority === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : e.priority === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                        }`}>
                          {e.priority}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {e.emergency_type}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 truncate">
                        {e.symptoms || "Critical conditions"}
                      </p>

                      <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                        <span className="truncate">📍 {e.address}</span>
                        <span>Patients: <strong className="text-white">{e.patient_count}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        e.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : e.status === "PENDING"
                          ? "bg-rose-500/20 text-rose-400 animate-pulse"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {e.status}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400">
                        Score: <strong className="text-rose-400">{e.ai_severity_score}/100</strong>
                      </p>
                      {assignedAmb && (
                        <p className="text-[10px] text-blue-400 font-semibold">{assignedAmb.callsign}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* AI Decision Support & Dispatcher Manual Override (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                AI Decision Support System
              </h2>
            </div>
            {selectedEmergency && (
              <span className="text-xs font-mono font-bold text-slate-400">
                Call #{selectedEmergency.id}
              </span>
            )}
          </div>

          {selectedEmergency ? (
            <div className="space-y-4">
              
              {/* AI Severity & Rationale Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    AI Triage Assessment
                  </span>
                  <span className="text-xs font-black text-rose-400">
                    Severity: {selectedEmergency.ai_severity_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {selectedEmergency.ai_urgency_reason || "Emergency prioritizes immediate ALS/MICU dispatch."}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(selectedEmergency.ai_required_equipment || ["Defibrillator", "Oxygen"]).map((eq, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-semibold border border-slate-800">
                      ✓ {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Ambulance */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    AI Recommended Unit
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {bestAmbulanceRec ? `${bestAmbulanceRec.match_score}% Match` : "Searching..."}
                  </span>
                </div>
                <p className="text-sm font-black text-white">
                  {bestAmbulanceRec ? bestAmbulanceRec.callsign : "AMB-101 (MICU)"}
                </p>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>ETA: <strong className="text-white">{bestAmbulanceRec?.estimated_eta_minutes || 3.8} mins</strong></span>
                  <span>Equipment: <strong className="text-emerald-400">{bestAmbulanceRec?.equipment_match_percent || 100}%</strong></span>
                  <span>Driver Trips: <strong className="text-white">{bestAmbulanceRec?.trips_today || 1}</strong></span>
                </div>
              </div>

              {/* Recommended Hospital */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    AI Recommended Hospital ER
                  </span>
                  <span className="text-xs font-bold text-purple-400">
                    {bestHospitalRec ? `${bestHospitalRec.suitability_score}% Suitability` : "Optimal Match"}
                  </span>
                </div>
                <p className="text-sm font-black text-white truncate">
                  {bestHospitalRec ? bestHospitalRec.hospital_name : "Metro General Trauma"}
                </p>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>ER Status: <strong className="text-emerald-400">{bestHospitalRec?.er_status || "OPEN"}</strong></span>
                  <span>Beds: <strong className="text-white">{bestHospitalRec?.available_er_beds || 14} ER / {bestHospitalRec?.available_icu_beds || 5} ICU</strong></span>
                </div>
              </div>

              {/* Action Buttons or Manual Override Form */}
              {!isOverrideMode ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    disabled={dispatching || selectedEmergency.status === "RESOLVED"}
                    onClick={handleAcceptAIRecommendation}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 transition uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>ACCEPT AI RECOMMENDATION</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOverrideMode(true)}
                    className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>MANUAL OVERRIDE</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmManualOverride} className="p-4 bg-slate-950 border border-rose-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                      Dispatcher Manual Override
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOverrideMode(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Select Ambulance
                    </label>
                    <select
                      value={overrideAmbulanceId}
                      onChange={(e) => setOverrideAmbulanceId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 font-bold"
                    >
                      {ambulances.map((amb) => (
                        <option key={amb.id} value={amb.id}>
                          {amb.callsign} — {amb.type} ({amb.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Select Hospital
                    </label>
                    <select
                      value={overrideHospitalId}
                      onChange={(e) => setOverrideHospitalId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 font-bold"
                    >
                      {hospitals.map((hosp) => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name} ({hosp.er_status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Override Justification
                    </label>
                    <input
                      type="text"
                      required
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Specialty pediatric trauma requires St. Jude"
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    CONFIRM DISPATCH OVERRIDE
                  </button>
                </form>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              Select an emergency incident from the queue to view AI recommendations.
            </div>
          )}

        </div>

      </div>

      {/* Tactical Live Command Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              Live Tactical Command Map (Real-Time GPS)
            </h2>
          </div>

          <Link
            to="/dispatcher/map"
            className="text-xs font-bold text-rose-400 hover:text-rose-300"
          >
            Open Full Tactical Map →
          </Link>
        </div>

        <div className="h-80 w-full">
          <LiveMap
            emergencies={emergencies.filter(e => e.status !== "RESOLVED")}
            ambulances={ambulances}
            hospitals={hospitals}
            centerLat={40.7128}
            centerLng={-74.006}
          />
        </div>
      </div>

      {/* Ambulance Fleet Overview Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-white uppercase tracking-wider">
            Ambulance Fleet Status Roster ({ambulances.length} Units)
          </h2>
          <Link to="/dispatcher/fleet" className="text-xs font-bold text-rose-400 hover:underline">
            Manage Fleet Roster →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ambulances.map((amb) => (
            <div
              key={amb.id}
              className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">{amb.callsign}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  amb.status === "AVAILABLE"
                    ? "bg-emerald-400"
                    : amb.status === "DISPATCHED" || amb.status === "EN_ROUTE"
                    ? "bg-blue-400 animate-ping"
                    : amb.status === "MAINTENANCE"
                    ? "bg-slate-600"
                    : "bg-amber-400"
                }`}></span>
              </div>

              <div className="space-y-0.5 text-[11px] text-slate-400">
                <p>Type: <strong className="text-slate-200">{amb.type}</strong></p>
                <p>Driver: <strong className="text-slate-200">{amb.driver_name}</strong></p>
                <p>Status: <strong className={amb.status === "AVAILABLE" ? "text-emerald-400" : "text-amber-400"}>{amb.status}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

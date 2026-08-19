import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { LiveMap } from "../common/LiveMap";
import { 
  Radio, 
  Siren, 
  Truck, 
  Hospital, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  Sliders, 
  Navigation, 
  RefreshCw,
  Search,
  UserCheck,
  ChevronRight,
  Zap,
  Info
} from "lucide-react";

export const DispatcherDashboard = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  
  // AI Recommendation State
  const [recommendedAmbulances, setRecommendedAmbulances] = useState([]);
  const [recommendedHospitals, setRecommendedHospitals] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Manual Override State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAmbulanceId, setOverrideAmbulanceId] = useState("");
  const [overrideHospitalId, setOverrideHospitalId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchControlCenterData();
  }, []);

  const fetchControlCenterData = async () => {
    setLoading(true);
    try {
      const [emData, ambData, hospData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);
      setEmergencies(emData);
      setAmbulances(ambData);
      setHospitals(hospData);

      // Auto select first pending emergency if available
      const pending = emData.find(e => e.status === "PENDING") || emData[0];
      if (pending && !selectedEmergency) {
        handleSelectEmergency(pending);
      }
    } catch (e) {
      console.error("Error fetching control center data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmergency = async (emergency) => {
    setSelectedEmergency(emergency);
    setRecommendationsLoading(true);
    try {
      const [ambRecs, hospRecs] = await Promise.all([
        api.getRecommendedAmbulances(emergency.id),
        api.getRecommendedHospitals(emergency.id)
      ]);
      setRecommendedAmbulances(ambRecs);
      setRecommendedHospitals(hospRecs);
    } catch (e) {
      console.error("Error fetching AI recommendations", e);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleConfirmAiDispatch = async (ambRec, hospRec) => {
    if (!selectedEmergency) return;
    try {
      await api.updateEmergencyStatus(selectedEmergency.id, {
        status: "DISPATCHED",
        assigned_ambulance_id: ambRec.ambulance.id,
        target_hospital_id: hospRec?.hospital.id || null
      });
      fetchControlCenterData();
      alert(`Dispatch confirmed! Ambulance ${ambRec.ambulance.callsign} assigned to Emergency #${selectedEmergency.id}`);
    } catch (err) {
      alert(`Dispatch error: ${err.message}`);
    }
  };

  const handleExecuteOverride = async (e) => {
    e.preventDefault();
    if (!selectedEmergency || !overrideAmbulanceId || !overrideReason) {
      alert("Please fill all override fields");
      return;
    }

    try {
      await api.dispatcherOverride(selectedEmergency.id, {
        ambulance_id: parseInt(overrideAmbulanceId),
        hospital_id: overrideHospitalId ? parseInt(overrideHospitalId) : null,
        override_reason: overrideReason
      });
      setShowOverrideModal(false);
      setOverrideReason("");
      fetchControlCenterData();
      alert("Dispatcher manual override executed successfully.");
    } catch (err) {
      alert(`Override failed: ${err.message}`);
    }
  };

  // Metrics computation
  const activeEmergencies = emergencies.filter(e => ["PENDING", "DISPATCHED", "EN_ROUTE", "ON_SCENE", "TRANSPORTING"].includes(e.status));
  const pendingCount = emergencies.filter(e => e.status === "PENDING").length;
  const availableAmbulances = ambulances.filter(a => a.status === "AVAILABLE");
  const dispatchedAmbulances = ambulances.filter(a => a.status !== "AVAILABLE" && a.status !== "MAINTENANCE");

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Quick Metrics Bar */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-rose-600/20 border border-rose-500/40 rounded-2xl animate-pulse-fast">
              <Radio className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">EMERGENCY CONTROL CENTER</h1>
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold">
                  COMMAND OPS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Real-Time AI Dispatching, Severity Triaging & Fleet Coordination Dashboard</p>
            </div>
          </div>

          <button
            onClick={fetchControlCenterData}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          
          <div className="bg-slate-950/80 border border-rose-500/30 p-4 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-400">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{pendingCount}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Pending Triage</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-blue-500/30 p-4 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{availableAmbulances.length} / {ambulances.length}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Available Fleet</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{dispatchedAmbulances.length}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Dispatches</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/30 p-4 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
              <Hospital className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{hospitals.filter(h => h.er_status === "OPEN").length} / {hospitals.length}</div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Open ER Centers</div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Left Pending Queue, Middle AI Decision Engine, Right Live Map & Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Emergencies Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Siren className="w-4 h-4 text-rose-500" /> Active Emergency Queue ({activeEmergencies.length})
            </h2>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {activeEmergencies.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active emergencies in queue.
              </div>
            ) : (
              activeEmergencies.map((e) => {
                const isSelected = selectedEmergency?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => handleSelectEmergency(e)}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                      isSelected
                        ? "bg-slate-950 border-rose-500/80 shadow-lg ring-1 ring-rose-500/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white uppercase ${
                        e.priority === "CRITICAL" ? "bg-rose-600 animate-pulse" :
                        e.priority === "HIGH" ? "bg-orange-600" :
                        e.priority === "MEDIUM" ? "bg-amber-600" : "bg-emerald-600"
                      }`}>
                        {e.priority || "PENDING"}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">#{e.id}</span>
                    </div>

                    <div className="text-sm font-bold text-white leading-snug">{e.emergency_type} - {e.caller_name}</div>
                    <p className="text-xs text-slate-300 line-clamp-2">{e.symptoms}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Status: <strong className="text-slate-200 uppercase">{e.status}</strong></span>
                      {e.is_dispatcher_override && (
                        <span className="text-amber-400 font-bold">Overridden</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Middle Column: AI Decision Support Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-400" /> AI Decision Support Engine
            </h2>
            {selectedEmergency && (
              <button
                onClick={() => setShowOverrideModal(true)}
                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" /> Manual Override
              </button>
            )}
          </div>

          {selectedEmergency ? (
            <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
              
              {/* Selected Emergency Summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400">Emergency #{selectedEmergency.id} Triage</div>
                  <span className="text-xs text-rose-400 font-bold">Severity: {selectedEmergency.ai_severity_score}/100</span>
                </div>
                <div className="text-sm font-extrabold text-white">{selectedEmergency.emergency_type} ({selectedEmergency.patient_count} Patient)</div>
                <p className="text-xs text-slate-300">{selectedEmergency.ai_urgency_reason}</p>

                <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-1 text-[11px]">
                  <span className="text-slate-400">Recommended Vehicle:</span>
                  <span className="text-blue-400 font-bold">{selectedEmergency.ai_recommended_type}</span>
                </div>
              </div>

              {/* AI Recommended Ambulances List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" /> Ranked AI Ambulance Recommendations
                </div>

                {recommendationsLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                    Computing Haversine distance, travel time & equipment match...
                  </div>
                ) : recommendedAmbulances.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No suitable ambulances available</div>
                ) : (
                  recommendedAmbulances.slice(0, 3).map((rec, index) => {
                    const hospRec = recommendedHospitals[0];
                    return (
                      <div key={rec.ambulance.id} className="bg-slate-950 border border-slate-800 hover:border-rose-500/40 p-3.5 rounded-2xl space-y-2 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                              index === 0 ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300"
                            }`}>
                              #{index + 1}
                            </span>
                            <span className="text-xs font-bold text-white">{rec.ambulance.callsign}</span>
                            <span className="text-[10px] text-slate-400">({rec.ambulance.type})</span>
                          </div>

                          <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-black">
                            {rec.match_score}% Match
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                          {rec.reasons.map((r, ri) => (
                            <div key={ri} className="text-[11px] text-slate-300 flex items-center gap-1">
                              <span className="text-rose-400 font-bold">•</span> {r}
                            </div>
                          ))}
                        </div>

                        {selectedEmergency.status === "PENDING" && (
                          <button
                            onClick={() => handleConfirmAiDispatch(rec, hospRec)}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm & Dispatch {rec.ambulance.callsign}</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Recommended Hospital Target */}
              {recommendedHospitals.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/30 space-y-2">
                  <div className="text-xs font-bold text-purple-300 uppercase flex items-center gap-1">
                    <Hospital className="w-3.5 h-3.5" /> Optimal Target Hospital
                  </div>
                  <div className="text-xs font-bold text-white">{recommendedHospitals[0].hospital.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Suitability Score: {recommendedHospitals[0].suitability_score}% | Beds Free: {recommendedHospitals[0].hospital.available_er_beds} ER / {recommendedHospitals[0].hospital.available_icu_beds} ICU
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              Select an emergency from the queue to run AI triage & ambulance ranking analysis.
            </div>
          )}
        </div>

        {/* Right Column: Live Control Map & Fleet Overview (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Control Center Live Map</h2>
            <LiveMap
              emergencies={emergencies}
              ambulances={ambulances}
              hospitals={hospitals}
              selectedEmergency={selectedEmergency}
              height="340px"
            />
          </div>

          {/* Active Fleet List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Status Overview ({ambulances.length})</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {ambulances.map((amb) => (
                <div key={amb.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{amb.callsign}</div>
                    <div className="text-[10px] text-slate-400">{amb.driver_name}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    amb.status === "AVAILABLE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                    amb.status === "DISPATCHED" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {amb.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && selectedEmergency && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Dispatcher Manual Override</h3>
              </div>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Manually override AI recommendation for Emergency #{selectedEmergency.id}. This action will be logged in the system audit trail.
            </p>

            <form onSubmit={handleExecuteOverride} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Ambulance</label>
                <select
                  required
                  value={overrideAmbulanceId}
                  onChange={(e) => setOverrideAmbulanceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                >
                  <option value="">-- Choose Ambulance --</option>
                  {ambulances.map(a => (
                    <option key={a.id} value={a.id}>{a.callsign} ({a.type}) - Status: {a.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Target Hospital (Optional)</label>
                <select
                  value={overrideHospitalId}
                  onChange={(e) => setOverrideHospitalId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                >
                  <option value="">-- Choose Hospital --</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} (ER Status: {h.er_status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Override (Safety Requirement)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State clinical or logistical reason for overriding AI recommendation..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Execute Override & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Truck, 
  Hospital, 
  Activity, 
  ArrowLeft,
  Check,
  Zap
} from "lucide-react";

export const AIDispatch = () => {
  const { lastMessage } = useWebSocket();
  const [emergencies, setEmergencies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [ambRecs, setAmbRecs] = useState([]);
  const [hospRecs, setHospRecs] = useState([]);
  const [dispatching, setDispatching] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchData = async () => {
    try {
      const data = await api.getEmergencies();
      const pendings = data.filter(e => e.status !== "RESOLVED" && e.status !== "CANCELLED");
      setEmergencies(pendings);
      if (!selectedId && pendings[0]) {
        setSelectedId(pendings[0].id);
      }
    } catch (err) {
      console.error("AI Dispatch fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  useEffect(() => {
    if (!selectedId) return;
    const fetchRecs = async () => {
      try {
        const [aRecs, hRecs] = await Promise.all([
          api.getRecommendedAmbulances(selectedId),
          api.getRecommendedHospitals(selectedId)
        ]);
        setAmbRecs(aRecs);
        setHospRecs(hRecs);
      } catch (err) {
        console.error("Recs error:", err);
      }
    };
    fetchRecs();
  }, [selectedId]);

  const selectedEmergency = emergencies.find(e => e.id === selectedId);

  const handleDispatchTop = async () => {
    if (!selectedEmergency || !ambRecs[0]) return;
    const topAmbId = ambRecs[0].ambulance?.id || ambRecs[0].ambulance_id;
    const topAmbCallsign = ambRecs[0].ambulance?.callsign || ambRecs[0].callsign;
    const topHospId = hospRecs[0]?.hospital?.id || hospRecs[0]?.hospital_id;

    setDispatching(true);
    try {
      await api.updateEmergencyStatus(selectedEmergency.id, {
        status: "DISPATCHED",
        assigned_ambulance_id: topAmbId,
        target_hospital_id: topHospId
      });
      setNotice(`Assigned ${topAmbCallsign} via AI Dispatch.`);
      setTimeout(() => setNotice(""), 4000);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to dispatch");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Multi-Factor AI Optimization Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            AI Dispatch Optimization Engine
          </h1>
          <p className="text-xs text-slate-400">
            Algorithmic scoring combining Haversine routing, vehicle capability, and hospital trauma match.
          </p>
        </div>

        <Link
          to="/dispatcher/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Center</span>
        </Link>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-2 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Select Call */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calls Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Active Calls for Triage ({emergencies.length})
          </h3>

          <div className="space-y-2">
            {emergencies.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedId(e.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                  selectedId === e.id
                    ? "bg-slate-800 border-rose-500 shadow-md shadow-rose-500/10"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">#{e.id}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                    e.priority === "CRITICAL" ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {e.priority}
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-1">{e.emergency_type}</p>
                <p className="text-[11px] text-slate-400 truncate">{e.address}</p>
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendations Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEmergency ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-rose-400">INCIDENT #{selectedEmergency.id}</span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    {selectedEmergency.emergency_type} Emergency Assessment
                  </h2>
                </div>

                <button
                  type="button"
                  disabled={dispatching || !ambRecs[0]}
                  onClick={handleDispatchTop}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow transition uppercase tracking-wider flex items-center space-x-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>DISPATCH OPTIMAL FLEET</span>
                </button>
              </div>

              {/* Ranked Ambulances List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ranked Fleet Units (Multi-Factor Scoring)
                </h3>

                <div className="space-y-2">
                  {ambRecs.map((rec, i) => {
                    const amb = rec.ambulance || rec;
                    return (
                      <div key={amb.id || i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                              RANK #{i + 1}
                            </span>
                            <span className="text-sm font-black text-white">{amb.callsign}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            ETA: <strong className="text-white">{rec.eta_minutes || rec.estimated_eta_minutes || 3.5} mins</strong> • Equipment Match: <strong className="text-emerald-400">{rec.equipment_match_percent}%</strong> • Shift Workload: {amb.trips_today || 0} trips
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-emerald-400">{rec.match_score}%</span>
                          <p className="text-[10px] text-slate-500 uppercase">Match Score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ranked Hospitals List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ranked Hospital Facilities
                </h3>

                <div className="space-y-2">
                  {hospRecs.map((hRec, i) => {
                    const hosp = hRec.hospital || hRec;
                    return (
                      <div key={hosp.id || i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                              RANK #{i + 1}
                            </span>
                            <span className="text-sm font-black text-white">{hosp.name || hRec.hospital_name}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Status: <strong className="text-emerald-400">{hosp.er_status}</strong> • Beds: {hosp.available_er_beds} ER / {hosp.available_icu_beds} ICU
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-purple-400">{hRec.suitability_score}%</span>
                          <p className="text-[10px] text-slate-500 uppercase">Suitability</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No emergency selected.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};


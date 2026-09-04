import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  AlertCircle,
  Search,
  MapPin,
  Truck,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

const priorityConfig = {
  CRITICAL: "bg-rose-500/20 text-rose-400 border border-rose-500/40",
  HIGH: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  MEDIUM: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
  LOW: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
};

const EmergencySkeleton = () => (
  <div className="divide-y divide-slate-800/60 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2.5">
            <div className="h-3 w-10 bg-slate-800 rounded" />
            <div className="h-5 w-20 bg-slate-800 rounded-full" />
            <div className="h-4 w-40 bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-3/4 bg-slate-800 rounded" />
          <div className="flex space-x-4">
            <div className="h-3 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="space-y-1 text-right shrink-0">
          <div className="h-6 w-24 bg-slate-800 rounded-full ml-auto" />
          <div className="h-3 w-20 bg-slate-800 rounded ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export const ActiveEmergencies = () => {
  const { lastMessage } = useWebSocket();
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [emergData, ambData, hospData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);
      setEmergencies(emergData);
      setAmbulances(ambData);
      setHospitals(hospData);
    } catch (err) {
      console.error("Emergencies fetch error:", err);
      setError(err.message || "Failed to load emergencies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const filtered = emergencies.filter(e => {
    const matchesSearch = !searchTerm ||
      e.emergency_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.symptoms && e.symptoms.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === "ALL" || e.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Operational Incident Queue</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            All Active &amp; Logged Emergencies
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-jurisdiction emergency incident management.
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

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search symptoms, location, incident..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer shrink-0 ${
                filterPriority === p
                  ? "bg-rose-600 text-white shadow"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-xs text-rose-400 font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl divide-y divide-slate-800/60">
        {loading ? (
          <EmergencySkeleton />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {emergencies.length === 0 ? "No emergency incidents found." : "No incidents match the current filter."}
          </div>
        ) : (
          filtered.map((e) => {
            const amb = ambulances.find(a => a.id === e.assigned_ambulance_id);
            const hosp = hospitals.find(h => h.id === e.target_hospital_id);
            const priCfg = priorityConfig[e.priority] || priorityConfig.MEDIUM;

            return (
              <div key={e.id} className="p-5 hover:bg-slate-800/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-black text-white">#{e.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${priCfg}`}>
                      {e.priority}
                    </span>
                    <span className="text-sm font-bold text-white">{e.emergency_type} Emergency</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {e.symptoms || "Critical conditions"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{e.address}</span>
                    </span>
                    <span>Caller: <strong className="text-slate-200">{e.caller_name}</strong></span>
                    <span>Patients: <strong className="text-white">{e.patient_count}</strong></span>
                    {hosp && <span>→ <strong className="text-purple-300">{hosp.name}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center space-x-6 shrink-0">
                  <div className="text-right space-y-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      e.status === "RESOLVED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : e.status === "CRITICAL" || e.status === "ON_SCENE"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {e.status}
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Unit: <strong className="text-blue-400">{amb ? amb.callsign : "Unassigned"}</strong>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

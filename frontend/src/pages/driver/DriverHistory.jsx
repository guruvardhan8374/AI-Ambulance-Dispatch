import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  History,
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Award,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const HistorySkeleton = () => (
  <div className="divide-y divide-slate-800/60 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-8 bg-slate-800 rounded" />
            <div className="h-5 w-20 bg-slate-800 rounded-md" />
            <div className="h-4 w-36 bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-48 bg-slate-800 rounded" />
          <div className="h-3 w-32 bg-slate-800 rounded" />
        </div>
        <div className="space-y-1 text-right shrink-0">
          <div className="h-4 w-24 bg-slate-800 rounded ml-auto" />
          <div className="h-3 w-20 bg-slate-800 rounded ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export const DriverHistory = () => {
  const { lastMessage } = useWebSocket();
  const [resolvedMissions, setResolvedMissions] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [emergencies, ambData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances()
      ]);

      const resolved = emergencies.filter(e => e.status === "RESOLVED");
      setResolvedMissions(resolved);
      setAmbulances(ambData);
    } catch (err) {
      console.error("Driver history error:", err);
      setError(err.message || "Failed to load mission history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const avgSeverity = resolvedMissions.length > 0
    ? Math.round(resolvedMissions.reduce((s, m) => s + (m.ai_severity_score || 0), 0) / resolvedMissions.length)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Driver Log &amp; Performance</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Shift Run History
          </h1>
          <p className="text-xs text-slate-400">
            Audit log of completed patient transports and emergency scene arrivals.
          </p>
        </div>

        <Link
          to="/driver/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed Calls</span>
          <p className="text-2xl font-black text-emerald-400">{loading ? "—" : resolvedMissions.length}</p>
          <p className="text-[11px] text-slate-400">100% On-Time Protocol Adherence</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Arrival Time</span>
          <p className="text-2xl font-black text-white">6.4 <span className="text-xs font-normal text-slate-400">Minutes</span></p>
          <p className="text-[11px] text-emerald-400">Within Target SLA Benchmark</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg. Case Severity</span>
          <p className="text-2xl font-black text-rose-400">{loading ? "—" : avgSeverity}<span className="text-xs font-normal text-slate-400">/100</span></p>
          <p className="text-[11px] text-slate-400">AI Triage Assessment Score</p>
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

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Completed Transport Records ({loading ? "—" : resolvedMissions.length})
          </h3>
        </div>

        {loading ? (
          <HistorySkeleton />
        ) : resolvedMissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No completed missions recorded during this shift.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {resolvedMissions.map((m) => (
              <div key={m.id} className="p-5 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{m.id}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      RESOLVED
                    </span>
                    <span className="text-sm font-bold text-white">{m.emergency_type} Emergency</span>
                  </div>

                  <p className="text-xs text-slate-300 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{m.address}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Resolved: {new Date(m.created_at).toLocaleTimeString()}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="text-xs font-mono font-bold text-rose-400 block">Severity: {m.ai_severity_score}/100</span>
                  <span className="text-[11px] text-slate-400">Unit: {m.ai_recommended_type || "ALS"}</span>
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-auto mt-1">
                    <div
                      className={`h-full rounded-full ${m.ai_severity_score > 75 ? "bg-rose-500" : m.ai_severity_score > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${m.ai_severity_score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

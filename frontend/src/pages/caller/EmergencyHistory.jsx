import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  History,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Siren,
  Calendar,
  RefreshCw
} from "lucide-react";

const HistorySkeleton = () => (
  <div className="divide-y divide-slate-800/60 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2.5">
            <div className="h-3 w-8 bg-slate-800 rounded" />
            <div className="h-5 w-16 bg-slate-800 rounded-md" />
            <div className="h-4 w-36 bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-2/3 bg-slate-800 rounded" />
          <div className="flex space-x-4">
            <div className="h-3 w-28 bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="space-y-1 text-right shrink-0">
          <div className="h-6 w-20 bg-slate-800 rounded-full ml-auto" />
          <div className="h-3 w-24 bg-slate-800 rounded ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export const EmergencyHistory = () => {
  const { lastMessage } = useWebSocket();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getEmergencies();
      setEmergencies(data);
    } catch (err) {
      console.error("History fetch error:", err);
      setError(err.message || "Failed to load emergency history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [lastMessage]);

  const resolvedCount = emergencies.filter(e => e.status === "RESOLVED").length;
  const activeCount = emergencies.filter(e => e.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Caller Record Logs</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Emergency Request History
          </h1>
          <p className="text-xs text-slate-400">
            Comprehensive audit log of all emergency calls and AI triage assessments.
          </p>
        </div>

        <Link
          to="/caller/request"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Siren className="w-4 h-4" />
          <span>New SOS Call</span>
        </Link>
      </div>

      {/* Summary KPIs */}
      {!loading && emergencies.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Records</span>
            <p className="text-2xl font-black text-white">{emergencies.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resolved</span>
            <p className="text-2xl font-black text-emerald-400">{resolvedCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active / In Progress</span>
            <p className="text-2xl font-black text-amber-400">{activeCount}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-xs text-rose-400 font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* History List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            All Incident Records ({loading ? "—" : emergencies.length})
          </h3>
        </div>

        {loading ? (
          <HistorySkeleton />
        ) : emergencies.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No past emergency incidents found on record.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {emergencies.map((e) => (
              <div key={e.id} className="p-5 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{e.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      e.priority === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : e.priority === "HIGH"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    }`}>
                      {e.priority}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {e.emergency_type} Emergency
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1">
                    {e.symptoms || "No clinical symptoms recorded."}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{e.address}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(e.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      e.status === "RESOLVED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {e.status}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      AI Score: {e.ai_severity_score}/100
                    </p>
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

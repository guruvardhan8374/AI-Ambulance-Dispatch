import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  ScrollText,
  Clock,
  ShieldCheck,
  User,
  Activity,
  ArrowLeft,
  Search,
  Filter,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const ACTION_TYPES = ["ALL", "AI_TRIAGE", "DISPATCHER_OVERRIDE", "STATUS_UPDATE", "EMERGENCY_CREATED"];

const actionColors = {
  AI_TRIAGE: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  DISPATCHER_OVERRIDE: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  STATUS_UPDATE: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  EMERGENCY_CREATED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
};

const LogSkeleton = () => (
  <div className="divide-y divide-slate-800/60 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-10 bg-slate-800 rounded" />
            <div className="h-5 w-32 bg-slate-800 rounded-lg" />
            <div className="h-3 w-24 bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-64 bg-slate-800 rounded" />
        </div>
        <div className="space-y-1 text-right">
          <div className="h-5 w-20 bg-slate-800 rounded-full ml-auto" />
          <div className="h-3 w-16 bg-slate-800 rounded ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export const AuditLogs = () => {
  const { lastMessage } = useWebSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDispatchLogs();
      setLogs(data);
    } catch (err) {
      console.error("Logs error:", err);
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [lastMessage]);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      String(log.emergency_id).includes(searchTerm) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.actor_role && log.actor_role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <ScrollText className="w-4 h-4" />
            <span>Compliance &amp; Audit Trail</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            System &amp; Dispatch Audit Logs
          </h1>
          <p className="text-xs text-slate-400">
            Immutable log of all AI automated triages, dispatcher overrides, and paramedic status updates.
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

      {/* Search + Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Emergency ID, actor, description..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            <Filter className="w-3 h-3 inline mr-1" />
            Filter:
          </span>
          {ACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterAction(type)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer border ${
                filterAction === type
                  ? "bg-rose-600 border-rose-500 text-white shadow"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {type.replace("_", " ")}
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
            onClick={fetchLogs}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Logged Events ({loading ? "—" : filtered.length})
          </span>
          <span className="text-xs font-mono text-emerald-400">Real-Time Sync Active</span>
        </div>

        {loading ? (
          <LogSkeleton />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {logs.length === 0 ? "No system audit logs recorded." : "No logs match the current filter."}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{log.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        actionColors[log.action] || "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Emergency #{log.emergency_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">{log.description}</p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    Actor: {log.actor_role}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "Just now"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

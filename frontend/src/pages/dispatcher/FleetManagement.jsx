import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Activity,
  Phone,
  ArrowLeft,
  Wrench,
  Search,
  RefreshCw
} from "lucide-react";

const STATUS_FILTERS = ["ALL", "AVAILABLE", "DISPATCHED", "ON_SCENE", "TRANSPORTING", "MAINTENANCE"];

const statusConfig = {
  AVAILABLE: { color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/20", dot: "bg-emerald-400" },
  DISPATCHED: { color: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/20", dot: "bg-blue-400 animate-ping" },
  ON_SCENE: { color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/20", dot: "bg-amber-400" },
  TRANSPORTING: { color: "text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-500/20", dot: "bg-cyan-400 animate-pulse" },
  MAINTENANCE: { color: "text-slate-400", border: "border-slate-600/40", bg: "bg-slate-700/40", dot: "bg-slate-500" },
};

const FleetSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-5 w-24 bg-slate-800 rounded-lg" />
            <div className="h-5 w-16 bg-slate-800 rounded-full" />
          </div>
          <div className="h-6 w-20 bg-slate-800 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-3/4 bg-slate-800 rounded" />
          <div className="h-3 w-1/2 bg-slate-800 rounded" />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-5 w-16 bg-slate-800 rounded-md" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const FleetManagement = () => {
  const { lastMessage } = useWebSocket();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAmbulances = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAmbulances();
      setAmbulances(data);
    } catch (err) {
      console.error("Fleet fetch error:", err);
      setError(err.message || "Failed to load fleet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, [lastMessage]);

  const handleToggleMaintenance = async (amb) => {
    const nextStatus = amb.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
    setUpdatingId(amb.id);
    try {
      await api.updateAmbulanceStatus(amb.id, { status: nextStatus });
      fetchAmbulances();
    } catch (err) {
      alert(err.message || "Failed to update fleet status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = ambulances.filter((amb) => {
    const matchesSearch =
      !searchTerm ||
      amb.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (amb.driver_name && amb.driver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (amb.vehicle_number && amb.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      amb.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || amb.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stat counts
  const statCounts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = ambulances.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Emergency Fleet Logistics</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Ambulance Fleet Management
          </h1>
          <p className="text-xs text-slate-400">
            Real-time status, onboard telemetry equipment, and driver shift scheduling.
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

      {/* Fleet Status Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATUS_FILTERS.slice(1).map((s) => {
          const cfg = statusConfig[s] || {};
          return (
            <div key={s} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{s}</span>
              <p className={`text-2xl font-black ${cfg.color}`}>{statCounts[s] || 0}</p>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-[10px] text-slate-500">units</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by callsign, driver, type..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer border ${
                filterStatus === s
                  ? "bg-rose-600 border-rose-500 text-white shadow"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {s}
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
            onClick={fetchAmbulances}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <FleetSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
          {ambulances.length === 0 ? "No ambulances in the fleet." : "No units match the current filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((amb) => {
            const cfg = statusConfig[amb.status] || statusConfig.MAINTENANCE;
            return (
              <div key={amb.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition">

                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">{amb.vehicle_number}</span>
                    <h3 className="text-lg font-black text-white mt-0.5">{amb.callsign}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {amb.type} Class
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {amb.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <p>Lead Paramedic: <strong className="text-white">{amb.driver_name}</strong></p>
                  <p>Phone: <span className="font-mono text-slate-300">{amb.driver_phone || "+1 (555) 014-9922"}</span></p>
                  <p>Trips Completed Today: <strong className="text-emerald-400">{amb.trips_today || 0}</strong></p>
                </div>

                {/* Equipment Chips */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Certified Equipment Inventory
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(amb.equipment || ["Defibrillator", "Oxygen"]).map((eq, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] font-semibold border border-slate-800">
                        ✓ {eq}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Toggle Action */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={updatingId === amb.id || (amb.status !== "AVAILABLE" && amb.status !== "MAINTENANCE")}
                    onClick={() => handleToggleMaintenance(amb)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 ${
                      amb.status === "MAINTENANCE"
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60"
                        : "bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      {updatingId === amb.id
                        ? "Updating..."
                        : amb.status === "MAINTENANCE"
                        ? "Return Unit to Available"
                        : "Set to Out of Service (Maintenance)"}
                    </span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

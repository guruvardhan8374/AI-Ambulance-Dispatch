import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import {
  Hospital,
  Bed,
  Activity,
  MapPin,
  Phone,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const HospitalSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-16 bg-slate-800 rounded-full" />
            <div className="h-5 w-48 bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-24 bg-slate-800 rounded ml-auto" />
            <div className="h-3 w-20 bg-slate-800 rounded ml-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-3/4 bg-slate-800 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-800 rounded" />
          <div className="h-2 w-full bg-slate-800 rounded-full" />
          <div className="h-2 w-full bg-slate-800 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const BedUtilizationBar = ({ label, available, total, color }) => {
  const occupied = total - available;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-400">{label}</span>
        <span className={`font-black ${color}`}>{available}<span className="text-slate-500 font-normal"> / {total}</span></span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{pct}% occupied</span>
        <span>{available} available</span>
      </div>
    </div>
  );
};

export const HospitalNetwork = () => {
  const { lastMessage } = useWebSocket();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error("Hospitals network error:", err);
      setError(err.message || "Failed to load hospital network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const openCount = hospitals.filter((h) => h.er_status === "OPEN").length;
  const busyCount = hospitals.filter((h) => h.er_status === "BUSY").length;
  const diversionCount = hospitals.filter((h) => h.er_status === "DIVERSION").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <Hospital className="w-4 h-4" />
            <span>Regional Healthcare Facilities</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Hospital Emergency Network
          </h1>
          <p className="text-xs text-slate-400">
            Real-time trauma levels, ER/ICU occupancy rates, and diversion monitoring.
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

      {/* Network Status Summary */}
      {!loading && hospitals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Open ERs</span>
            <p className="text-2xl font-black text-emerald-400">{openCount}</p>
            <span className="text-[10px] text-emerald-400 font-semibold">Accepting Patients</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Busy ERs</span>
            <p className="text-2xl font-black text-amber-400">{busyCount}</p>
            <span className="text-[10px] text-amber-400 font-semibold">High Occupancy</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Diversion</span>
            <p className="text-2xl font-black text-rose-400">{diversionCount}</p>
            <span className="text-[10px] text-rose-400 font-semibold">Not Accepting</span>
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
            onClick={fetchData}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <HospitalSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hospitals.map((hosp) => (
            <div key={hosp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 hover:border-slate-700 transition">

              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    hosp.er_status === "OPEN"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : hosp.er_status === "BUSY"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}>
                    {hosp.er_status}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{hosp.name}</h3>
                  <p className="text-xs text-purple-400 font-semibold">{hosp.trauma_level}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {hosp.available_er_beds} / {hosp.total_er_beds} ER
                  </span>
                  <p className="text-[11px] font-mono text-rose-400 mt-0.5">
                    {hosp.available_icu_beds} / {hosp.total_icu_beds} ICU
                  </p>
                </div>
              </div>

              {/* Bed Utilization Bars */}
              <div className="space-y-3">
                <BedUtilizationBar
                  label="Emergency Room (ER)"
                  available={hosp.available_er_beds}
                  total={hosp.total_er_beds}
                  color="text-emerald-400"
                />
                <BedUtilizationBar
                  label="Intensive Care (ICU)"
                  available={hosp.available_icu_beds}
                  total={hosp.total_icu_beds}
                  color="text-rose-400"
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{hosp.address}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{hosp.contact_number || "+1 (212) 555-0100"}</span>
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Specialties &amp; Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(hosp.specialties || ["Trauma", "Cardiology"]).map((spec, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 text-[11px] font-semibold border border-slate-800">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

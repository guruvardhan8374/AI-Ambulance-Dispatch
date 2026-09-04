import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { 
  Building2, 
  ShieldCheck, 
  Activity, 
  Bed, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft 
} from "lucide-react";

export const HospitalStatus = () => {
  const { lastMessage } = useWebSocket();
  const [hospitals, setHospitals] = useState([]);

  const fetchData = async () => {
    try {
      const data = await api.getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error("Status fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Regional Hospital Network Overview</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Hospital Department Readiness
          </h1>
          <p className="text-xs text-slate-400">
            Certified trauma levels, clinical specialty units, and active diversion status.
          </p>
        </div>

        <Link
          to="/hospital/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hospitals.map((hosp) => (
          <div key={hosp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            
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
                  {hosp.available_er_beds} / {hosp.total_er_beds} ER Beds
                </span>
                <p className="text-[11px] font-mono text-rose-400 mt-0.5">
                  {hosp.available_icu_beds} / {hosp.total_icu_beds} ICU Beds
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{hosp.address}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{hosp.contact_number || "+1 (212) 555-0100"}</span>
              </p>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Clinical Specialty Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(hosp.specialties || ["Trauma", "Cardiology", "Neurology"]).map((spec, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 text-[11px] font-semibold border border-slate-800">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

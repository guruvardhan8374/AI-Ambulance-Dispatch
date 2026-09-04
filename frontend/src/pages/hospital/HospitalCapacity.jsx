import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { 
  Activity, 
  Bed, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ArrowLeft, 
  Building2,
  ShieldAlert,
  Save
} from "lucide-react";

export const HospitalCapacity = () => {
  const { lastMessage } = useWebSocket();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    try {
      const data = await api.getHospitals();
      setHospitals(data);
      if (!selectedHospitalId && data[0]) {
        setSelectedHospitalId(data[0].id);
      }
    } catch (err) {
      console.error("Capacity fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  const handleUpdateCapacity = async (updates) => {
    if (!currentHospital) return;
    setUpdating(true);
    setSuccessMsg("");
    try {
      const updated = await api.updateHospitalCapacity(currentHospital.id, updates);
      setHospitals(hospitals.map(h => h.id === updated.id ? updated : h));
      setSuccessMsg("Hospital capacity synchronized to Central Dispatch.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.message || "Failed to update hospital capacity");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Facility Resource Manager</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            ER & ICU Capacity Management
          </h1>
          <p className="text-xs text-slate-400">
            Dynamically regulate bed inventory, trauma bays, and diversion status.
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

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-2 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Capacity Configurator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-black text-white">
            {currentHospital?.name}
          </h2>
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
            {currentHospital?.trauma_level}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Emergency Department Bed Controls */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Emergency Department Beds (ER)
              </span>
              <Bed className="w-4 h-4 text-purple-400" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white">{currentHospital?.available_er_beds}</p>
                <p className="text-xs text-slate-500">Available out of {currentHospital?.total_er_beds} Total</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={updating || currentHospital?.available_er_beds <= 0}
                  onClick={() => handleUpdateCapacity({ available_er_beds: currentHospital.available_er_beds - 1 })}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={updating || currentHospital?.available_er_beds >= currentHospital?.total_er_beds}
                  onClick={() => handleUpdateCapacity({ available_er_beds: currentHospital.available_er_beds + 1 })}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ICU Bed Controls */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Intensive Care Units (ICU)
              </span>
              <Activity className="w-4 h-4 text-rose-400" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-rose-400">{currentHospital?.available_icu_beds}</p>
                <p className="text-xs text-slate-500">Available out of {currentHospital?.total_icu_beds} Total</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={updating || currentHospital?.available_icu_beds <= 0}
                  onClick={() => handleUpdateCapacity({ available_icu_beds: currentHospital.available_icu_beds - 1 })}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={updating || currentHospital?.available_icu_beds >= currentHospital?.total_icu_beds}
                  onClick={() => handleUpdateCapacity({ available_icu_beds: currentHospital.available_icu_beds + 1 })}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

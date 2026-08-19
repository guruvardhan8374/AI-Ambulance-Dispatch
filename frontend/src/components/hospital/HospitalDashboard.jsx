import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  Hospital, 
  Bed, 
  Activity, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  AlertCircle,
  Truck
} from "lucide-react";

export const HospitalDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    setLoading(true);
    try {
      const [hospList, emList, ambList] = await Promise.all([
        api.getHospitals(),
        api.getEmergencies(),
        api.getAmbulances()
      ]);

      setHospitals(hospList);
      setEmergencies(emList);
      setAmbulances(ambList);

      if (hospList.length > 0 && !selectedHospital) {
        setSelectedHospital(hospList[0]);
      }
    } catch (e) {
      console.error("Error loading hospital data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCapacityUpdate = async (field, value) => {
    if (!selectedHospital) return;
    try {
      const updateData = { [field]: value };
      const updated = await api.updateHospitalCapacity(selectedHospital.id, updateData);
      setSelectedHospital(updated);
      setHospitals(prev => prev.map(h => h.id === updated.id ? updated : h));
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    }
  };

  // Incoming emergencies targeted for this hospital
  const incomingEmergencies = emergencies.filter(e => 
    e.target_hospital_id === selectedHospital?.id &&
    ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "TRANSPORTING"].includes(e.status)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-purple-600/20 border border-purple-500/40 rounded-2xl">
            <Hospital className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Hospital Emergency Department Coordination</h1>
            <p className="text-xs text-slate-300 mt-0.5">Real-time ICU & ER Bed Capacity Management & Inbound Ambulance Readiness</p>
          </div>
        </div>

        {/* Hospital Selector */}
        {hospitals.length > 0 && (
          <select
            value={selectedHospital?.id || ""}
            onChange={(e) => {
              const h = hospitals.find(item => item.id === parseInt(e.target.value));
              if (h) setSelectedHospital(h);
            }}
            className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedHospital && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Capacity Control Center Card */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" /> Live ER Capacity Controls
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white uppercase ${
                selectedHospital.er_status === "OPEN" ? "bg-emerald-600" :
                selectedHospital.er_status === "BUSY" ? "bg-amber-600" : "bg-rose-600"
              }`}>
                {selectedHospital.er_status}
              </span>
            </div>

            {/* Status Switcher Buttons */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">ER Acceptance Status</label>
              <div className="grid grid-cols-3 gap-2">
                {["OPEN", "BUSY", "DIVERSION"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleCapacityUpdate("er_status", st)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      selectedHospital.er_status === st
                        ? st === "OPEN" ? "bg-emerald-600 text-white border-emerald-500" :
                          st === "BUSY" ? "bg-amber-600 text-white border-amber-500" : "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Available ER Beds Control */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-emerald-400" /> Available ER Beds
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {selectedHospital.available_er_beds} / {selectedHospital.total_er_beds}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCapacityUpdate("available_er_beds", Math.max(0, selectedHospital.available_er_beds - 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max={selectedHospital.total_er_beds}
                  value={selectedHospital.available_er_beds}
                  onChange={(e) => handleCapacityUpdate("available_er_beds", parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <button
                  onClick={() => handleCapacityUpdate("available_er_beds", Math.min(selectedHospital.total_er_beds, selectedHospital.available_er_beds + 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Available ICU Beds Control */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" /> Available ICU Beds
                </span>
                <span className="text-lg font-black text-purple-400">
                  {selectedHospital.available_icu_beds} / {selectedHospital.total_icu_beds}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCapacityUpdate("available_icu_beds", Math.max(0, selectedHospital.available_icu_beds - 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max={selectedHospital.total_icu_beds}
                  value={selectedHospital.available_icu_beds}
                  onChange={(e) => handleCapacityUpdate("available_icu_beds", parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <button
                  onClick={() => handleCapacityUpdate("available_icu_beds", Math.min(selectedHospital.total_icu_beds, selectedHospital.available_icu_beds + 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Hospital Overview Info */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-bold text-white">{selectedHospital.trauma_level}</div>
              <div>Address: {selectedHospital.address}</div>
              <div>Specialties: {selectedHospital.specialties?.join(", ")}</div>
            </div>

          </div>

          {/* Incoming Emergency Patients Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400" /> Incoming Ambulance Admissions
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time alerts for inbound patient transports</p>
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">
                  {incomingEmergencies.length} Inbound
                </span>
              </div>

              {incomingEmergencies.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">No Inbound Ambulances En Route</div>
                  <p className="text-xs">Your ER department capacity metrics are synchronized with central dispatch.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingEmergencies.map((em) => {
                    const amb = ambulances.find(a => a.id === em.assigned_ambulance_id);
                    return (
                      <div key={em.id} className="bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 space-y-3 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white uppercase ${
                              em.priority === "CRITICAL" ? "bg-rose-600" : "bg-orange-600"
                            }`}>
                              {em.priority}
                            </span>
                            <span className="text-sm font-bold text-white">Emergency #{em.id} - {em.emergency_type}</span>
                          </div>
                          <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Transporting (ETA ~8 mins)
                          </span>
                        </div>

                        <p className="text-xs text-slate-300">{em.symptoms}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-1">
                          <div>Patient: <strong className="text-white">{em.caller_name} ({em.patient_count})</strong></div>
                          <div>Ambulance: <strong className="text-blue-400">{amb?.callsign || "En Route"}</strong></div>
                          <div>Driver Contact: <strong className="text-slate-200">{amb?.driver_phone || "N/A"}</strong></div>
                        </div>

                        {em.special_requirements?.length > 0 && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold">Special Prep:</span>
                            {em.special_requirements.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] rounded border border-slate-700">
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-900">
                          <button
                            onClick={() => alert(`ER Team Notified: Bed Reserved for Emergency #${em.id}`)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm ER Bed Allocation
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
};

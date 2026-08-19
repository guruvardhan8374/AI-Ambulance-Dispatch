import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { LiveMap } from "../common/LiveMap";
import { 
  Truck, 
  MapPin, 
  Phone, 
  Hospital, 
  Activity, 
  Navigation, 
  CheckCircle2, 
  Play, 
  Pause, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

export const DriverDashboard = () => {
  const [allAmbulances, setAllAmbulances] = useState([]);
  const [driverAmbulance, setDriverAmbulance] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverState();
  }, []);

  const fetchDriverState = async (selectedAmbId = null) => {
    setLoading(true);
    try {
      const [ambList, emList, hospList] = await Promise.all([
        api.getAmbulances(),
        api.getEmergencies(),
        api.getHospitals()
      ]);

      setAllAmbulances(ambList);
      setHospitals(hospList);

      let myAmb = null;
      if (selectedAmbId) {
        myAmb = ambList.find(a => a.id === selectedAmbId);
      } else if (driverAmbulance) {
        myAmb = ambList.find(a => a.id === driverAmbulance.id);
      }

      if (!myAmb) {
        myAmb = ambList.find(a => a.callsign.includes("AMB-101")) || ambList[0];
      }

      setDriverAmbulance(myAmb);

      if (myAmb) {
        const job = emList.find(e => e.assigned_ambulance_id === myAmb.id && e.status !== "RESOLVED" && e.status !== "CANCELLED");
        setActiveJob(job || null);
      }
    } catch (e) {
      console.error("Error loading driver state", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAmbulance = (ambId) => {
    fetchDriverState(ambId);
  };

  const handleStatusTransition = async (nextStatus) => {
    if (!activeJob || !driverAmbulance) return;
    try {
      const updated = await api.updateEmergencyStatus(activeJob.id, {
        status: nextStatus,
        assigned_ambulance_id: driverAmbulance.id,
        target_hospital_id: activeJob.target_hospital_id
      });
      
      if (nextStatus === "RESOLVED") {
        setActiveJob(null);
        setIsSimulating(false);
      } else {
        setActiveJob(updated);
      }
      fetchDriverState();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Simulated GPS Movement Interval
  useEffect(() => {
    let interval = null;
    if (isSimulating && activeJob && driverAmbulance) {
      interval = setInterval(async () => {
        // Target destination depends on emergency status
        let targetLat = activeJob.latitude;
        let targetLon = activeJob.longitude;

        if (["TRANSPORTING", "ARRIVED_HOSPITAL"].includes(activeJob.status)) {
          const hosp = hospitals.find(h => h.id === activeJob.target_hospital_id);
          if (hosp) {
            targetLat = hosp.latitude;
            targetLon = hosp.longitude;
          }
        }

        // Interpolate small step (0.001 deg ~ 100m)
        const dLat = targetLat - driverAmbulance.latitude;
        const dLon = targetLon - driverAmbulance.longitude;

        if (Math.abs(dLat) < 0.0005 && Math.abs(dLon) < 0.0005) {
          setIsSimulating(false);
          return;
        }

        const newLat = driverAmbulance.latitude + (dLat * 0.15);
        const newLon = driverAmbulance.longitude + (dLon * 0.15);

        try {
          const updatedAmb = await api.updateAmbulanceLocation(driverAmbulance.id, {
            latitude: newLat,
            longitude: newLon
          });
          setDriverAmbulance(updatedAmb);
        } catch (e) {
          console.error("GPS simulation error", e);
        }

      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, activeJob, driverAmbulance, hospitals]);

  const targetHospital = hospitals.find(h => h.id === activeJob?.target_hospital_id);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Driver Header */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-blue-600/20 border border-blue-500/40 rounded-2xl">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-white">{driverAmbulance?.callsign || "AMB-101"}</span>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold">
                {driverAmbulance?.type || "ALS"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Paramedic Lead: {driverAmbulance?.driver_name}</p>
          </div>
        </div>

        {/* Active Vehicle Switcher & GPS Simulator Button */}
        <div className="flex items-center space-x-3">
          {allAmbulances.length > 0 && (
            <select
              value={driverAmbulance?.id || ""}
              onChange={(e) => handleSelectAmbulance(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500"
            >
              {allAmbulances.map(a => (
                <option key={a.id} value={a.id}>{a.callsign} ({a.status})</option>
              ))}
            </select>
          )}

          {activeJob && (
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                isSimulating
                  ? "bg-amber-600 text-white border-amber-500 shadow-lg animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSimulating ? "Pause GPS Simulation" : "Simulate GPS Route Movement"}</span>
            </button>
          )}
        </div>
      </div>

      {activeJob ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dispatch Job Details & Actions */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Active Job Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> Assigned Dispatch Job
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white uppercase ${
                  activeJob.priority === "CRITICAL" ? "bg-rose-600" :
                  activeJob.priority === "HIGH" ? "bg-orange-600" : "bg-amber-600"
                }`}>
                  {activeJob.priority}
                </span>
              </div>

              <div>
                <div className="text-base font-extrabold text-white">{activeJob.emergency_type} Emergency</div>
                <p className="text-xs text-slate-300 mt-1">{activeJob.symptoms}</p>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Caller:</span>
                  <span className="text-white font-semibold">{activeJob.caller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-blue-400 font-semibold">{activeJob.caller_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200 text-right max-w-[180px] font-medium">{activeJob.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patients:</span>
                  <span className="text-white font-semibold">{activeJob.patient_count}</span>
                </div>
              </div>

              {/* Required Equipment Checklist */}
              {activeJob.ai_required_equipment?.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">Paramedic Equipment Checklist</label>
                  <div className="flex flex-wrap gap-1.5">
                    {activeJob.ai_required_equipment.map((eq, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Hospital */}
              {targetHospital && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30 space-y-1">
                  <div className="text-[10px] text-purple-400 uppercase font-bold">Target Hospital Destination</div>
                  <div className="text-xs font-bold text-white">{targetHospital.name}</div>
                  <div className="text-[11px] text-slate-400">{targetHospital.address}</div>
                </div>
              )}

              {/* Job Workflow Controls */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Update Workflow Status</div>
                
                {activeJob.status === "DISPATCHED" && (
                  <button
                    onClick={() => handleStatusTransition("EN_ROUTE")}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>ACCEPT & START EN ROUTE TO PATIENT</span>
                  </button>
                )}

                {activeJob.status === "EN_ROUTE" && (
                  <button
                    onClick={() => handleStatusTransition("ON_SCENE")}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>CONFIRM ARRIVED ON SCENE</span>
                  </button>
                )}

                {activeJob.status === "ON_SCENE" && (
                  <button
                    onClick={() => handleStatusTransition("TRANSPORTING")}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>START TRANSPORTING TO HOSPITAL</span>
                  </button>
                )}

                {activeJob.status === "TRANSPORTING" && (
                  <button
                    onClick={() => handleStatusTransition("ARRIVED_HOSPITAL")}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Hospital className="w-4 h-4" />
                    <span>CONFIRM ARRIVED AT HOSPITAL ER</span>
                  </button>
                )}

                {activeJob.status === "ARRIVED_HOSPITAL" && (
                  <button
                    onClick={() => handleStatusTransition("RESOLVED")}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>COMPLETE DISPATCH JOB & CLEAR AMBULANCE</span>
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* Interactive Navigation Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turn-By-Turn Route Navigation Map</h3>
                <span className="text-xs text-blue-400 font-semibold">
                  Status: {activeJob.status}
                </span>
              </div>

              <LiveMap
                emergencies={[activeJob]}
                ambulances={driverAmbulance ? [driverAmbulance] : []}
                hospitals={hospitals}
                selectedEmergency={activeJob}
                height="500px"
              />
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Ambulance {driverAmbulance?.callsign} Available</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You currently have no assigned dispatch jobs. The AI Command Center will automatically notify you when an emergency request is assigned to your callsign.
          </p>
        </div>
      )}

    </div>
  );
};

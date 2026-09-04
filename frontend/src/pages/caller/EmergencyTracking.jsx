import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Hospital, 
  Phone, 
  ShieldAlert, 
  Activity, 
  ArrowLeft,
  Navigation,
  CheckCircle2
} from "lucide-react";

export const EmergencyTracking = () => {
  const { lastMessage } = useWebSocket();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [assignedAmbulance, setAssignedAmbulance] = useState(null);
  const [targetHospital, setTargetHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrackingData = async () => {
    try {
      const emergencies = await api.getEmergencies();
      const active = emergencies.find(e => e.status !== "RESOLVED" && e.status !== "CANCELLED") || emergencies[0] || null;
      setActiveEmergency(active);

      if (active?.assigned_ambulance_id) {
        const ambulances = await api.getAmbulances();
        const amb = ambulances.find(a => a.id === active.assigned_ambulance_id);
        setAssignedAmbulance(amb || null);
      } else {
        setAssignedAmbulance(null);
      }

      if (active?.target_hospital_id) {
        const hospitals = await api.getHospitals();
        const hosp = hospitals.find(h => h.id === active.target_hospital_id);
        setTargetHospital(hosp || null);
      } else {
        setTargetHospital(null);
      }
    } catch (err) {
      console.error("Tracking fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [lastMessage]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Navigation className="w-4 h-4 animate-spin-slow" />
            <span>Real-Time GPS Tracking Console</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Live Ambulance Telemetry
          </h1>
          <p className="text-xs text-slate-400">
            Monitor the assigned medical unit traveling directly towards your incident location.
          </p>
        </div>

        <Link
          to="/caller/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {activeEmergency ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Map View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-white">Tactical Map View</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Lat: {activeEmergency?.latitude?.toFixed(4)}, Lng: {activeEmergency?.longitude?.toFixed(4)}
              </span>
            </div>

            <div className="h-[520px] w-full">
              <LiveMap
                emergencies={[activeEmergency]}
                ambulances={assignedAmbulance ? [assignedAmbulance] : []}
                hospitals={targetHospital ? [targetHospital] : []}
                centerLat={activeEmergency.latitude}
                centerLng={activeEmergency.longitude}
              />
            </div>
          </div>

          {/* Telemetry Sidebar Details */}
          <div className="space-y-4">
            
            {/* Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mission Status</span>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {activeEmergency.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estimated ETA</span>
                    <span className="text-base font-black text-white">
                      {activeEmergency.status === "ON_SCENE" ? "AMBULANCE ON SCENE" : "3 - 5 Minutes"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <Truck className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Unit</span>
                    <span className="text-sm font-bold text-white">
                      {assignedAmbulance ? assignedAmbulance.callsign : "Dispatching Crew..."}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Paramedic: {assignedAmbulance?.driver_name || "Lead Medic"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <Hospital className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target ER Facility</span>
                    <span className="text-sm font-bold text-white">
                      {targetHospital ? targetHospital.name : "Metro General Level-1 Trauma"}
                    </span>
                    <p className="text-[11px] text-emerald-400 font-semibold">
                      ER Status: {targetHospital?.er_status || "OPEN"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pickup Address</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {activeEmergency.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick First-Aid Guidance */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                <Activity className="w-4 h-4" />
                <span>Bystander First-Aid Guidance</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                <li>Keep the patient calm, rested, and still.</li>
                <li>Do not leave the patient unattended.</li>
                <li>If patient is unresponsive and not breathing, begin chest compressions.</li>
                <li>Ensure entrance and hallways are clear for incoming paramedics.</li>
              </ul>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Emergency to Track</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All your requests are resolved or no dispatch is currently in progress.
          </p>
          <Link
            to="/caller/request"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            Create New Emergency Request
          </Link>
        </div>
      )}

    </div>
  );
};

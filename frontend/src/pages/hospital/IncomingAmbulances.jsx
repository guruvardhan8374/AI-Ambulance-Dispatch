import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { 
  Truck, 
  Clock, 
  Hospital, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Check
} from "lucide-react";

export const IncomingAmbulances = () => {
  const { lastMessage } = useWebSocket();
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [acceptedCalls, setAcceptedCalls] = useState({});

  const fetchData = async () => {
    try {
      const [emergData, ambData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances()
      ]);
      setEmergencies(emergData.filter(e => e.status !== "RESOLVED" && e.status !== "CANCELLED"));
      setAmbulances(ambData);
    } catch (err) {
      console.error("Incoming fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const handleAction = (id, action) => {
    setAcceptedCalls(prev => ({ ...prev, [id]: action }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Emergency Receiving Bay</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Incoming Ambulance Transport Queue
          </h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry and triage manifest for inbound critical care units.
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

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl divide-y divide-slate-800/60">
        {emergencies.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No incoming ambulance transports reported at this time.
          </div>
        ) : (
          emergencies.map((e) => {
            const amb = ambulances.find(a => a.id === e.assigned_ambulance_id);
            const status = acceptedCalls[e.id];

            return (
              <div key={e.id} className="p-6 hover:bg-slate-800/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/30">
                      {amb ? amb.callsign : "UNIT AMB-101"}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">INCIDENT #{e.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      e.priority === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    }`}>
                      {e.priority} PRIORITY
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {e.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {e.emergency_type} Emergency
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Symptoms: {e.symptoms || "Critical conditions observed."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>Patient Count: <strong className="text-white">{e.patient_count}</strong></span>
                    <span>AI Severity: <strong className="text-rose-400">{e.ai_severity_score}/100</strong></span>
                    <span>Recommended Unit: <strong className="text-emerald-400">{e.ai_recommended_type || "ALS"}</strong></span>
                    <span>ETA: <strong className="text-emerald-400">3 - 6 Minutes</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 shrink-0">
                  {status === "ACCEPTED" ? (
                    <span className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                      <Check className="w-4 h-4" />
                      <span>BED CONFIRMED & READY</span>
                    </span>
                  ) : status === "REJECTED" ? (
                    <span className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center space-x-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>REDIRECTED / DIVERTED</span>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(e.id, "ACCEPTED")}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                      >
                        [ ACCEPT PATIENT ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(e.id, "REJECTED")}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                      >
                        [ REJECT ]
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

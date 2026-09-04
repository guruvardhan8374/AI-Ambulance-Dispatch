import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import {
  Map as MapIcon,
  Truck,
  Hospital,
  AlertTriangle,
  ArrowLeft,
  Activity
} from "lucide-react";

export const LiveCommandMap = () => {
  const { lastMessage } = useWebSocket();
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [showAmbulances, setShowAmbulances] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);

  const fetchData = async () => {
    try {
      const [emergData, ambData, hospData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);
      setEmergencies(emergData.filter(e => e.status !== "RESOLVED"));
      setAmbulances(ambData);
      setHospitals(hospData);
    } catch (err) {
      console.error("Map fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage]);

  const activeUnits = ambulances.filter(a => ["DISPATCHED", "ON_SCENE", "TRANSPORTING"].includes(a.status)).length;
  const openHospitals = hospitals.filter(h => h.er_status === "OPEN").length;
  const criticalEmergencies = emergencies.filter(e => e.priority === "CRITICAL").length;

  return (
    <div className="space-y-6">

      {/* Header & Layer Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <MapIcon className="w-4 h-4" />
            <span>Tactical Geographic Information System</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Full Tactical Command Map
          </h1>
          <p className="text-xs text-slate-400">
            Real-time GPS coordinates of ambulances, incident hotspots, and hospital ERs.
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmergencies(!showEmergencies)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              showEmergencies ? "bg-rose-600 border-rose-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            🚨 Emergencies ({emergencies.length})
          </button>
          <button
            type="button"
            onClick={() => setShowAmbulances(!showAmbulances)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              showAmbulances ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            🚑 Ambulances ({ambulances.length})
          </button>
          <button
            type="button"
            onClick={() => setShowHospitals(!showHospitals)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              showHospitals ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            🏥 Hospitals ({hospitals.length})
          </button>
          <Link
            to="/dispatcher/dashboard"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-rose-400">{criticalEmergencies}</p>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Critical Incidents</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{activeUnits}</p>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">En-Route Units</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Hospital className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">{openHospitals}</p>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open Hospitals</span>
          </div>
        </div>
      </div>

      {/* Full-Screen Style Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Live Central Dispatch Tactical Map</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Active Units: {activeUnits} | Total Fleet: {ambulances.filter(a => a.status !== "MAINTENANCE").length}
          </span>
        </div>

        <div className="h-[620px] w-full">
          <LiveMap
            emergencies={showEmergencies ? emergencies : []}
            ambulances={showAmbulances ? ambulances : []}
            hospitals={showHospitals ? hospitals : []}
            centerLat={40.7128}
            centerLng={-74.006}
          />
        </div>
      </div>

    </div>
  );
};

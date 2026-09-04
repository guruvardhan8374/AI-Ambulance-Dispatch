import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useWebSocket } from "../../context/WebSocketContext";
import { LiveMap } from "../../components/common/LiveMap";
import { 
  Navigation as NavIcon, 
  Truck, 
  MapPin, 
  Hospital, 
  Play, 
  RotateCcw, 
  Clock, 
  ArrowLeft,
  Compass,
  CheckCircle2
} from "lucide-react";

export const Navigation = () => {
  const { lastMessage } = useWebSocket();
  const [ambulances, setAmbulances] = useState([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchData = async () => {
    try {
      const [ambData, emergData, hospData] = await Promise.all([
        api.getAmbulances(),
        api.getEmergencies(),
        api.getHospitals()
      ]);

      setAmbulances(ambData);
      setHospitals(hospData);

      const amb = ambData.find(a => a.id === selectedAmbulanceId) || ambData[0];
      if (!selectedAmbulanceId && amb) {
        setSelectedAmbulanceId(amb.id);
      }

      const active = emergData.find(e => 
        (e.assigned_ambulance_id === amb?.id || (!e.assigned_ambulance_id && e.status === "DISPATCHED")) &&
        e.status !== "RESOLVED" && e.status !== "CANCELLED"
      ) || emergData[0] || null;

      setActiveEmergency(active);
    } catch (err) {
      console.error("Navigation data error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastMessage, selectedAmbulanceId]);

  const currentAmbulance = ambulances.find(a => a.id === selectedAmbulanceId) || ambulances[0];
  const targetHospital = hospitals.find(h => h.id === activeEmergency?.target_hospital_id) || hospitals[0];

  const handleStepGPS = async () => {
    if (!currentAmbulance || !activeEmergency) return;
    try {
      const isHeadingToHospital = activeEmergency.status === "TRANSPORTING";
      const targetLat = isHeadingToHospital && targetHospital ? targetHospital.latitude : activeEmergency.latitude;
      const targetLng = isHeadingToHospital && targetHospital ? targetHospital.longitude : activeEmergency.longitude;

      const newLat = Number((currentAmbulance.latitude + (targetLat - currentAmbulance.latitude) * 0.35).toFixed(6));
      const newLng = Number((currentAmbulance.longitude + (targetLng - currentAmbulance.longitude) * 0.35).toFixed(6));

      await api.updateAmbulanceLocation(currentAmbulance.id, {
        latitude: newLat,
        longitude: newLng
      });
    } catch (err) {
      console.error("GPS update error:", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>Turn-by-Turn GPS HUD</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Tactical Mission Navigation
          </h1>
          <p className="text-xs text-slate-400">
            Field route guidance linking Ambulance, Emergency Scene, and Receiving Hospital ER.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleStepGPS}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Simulate GPS Move Forward</span>
          </button>

          <Link
            to="/driver/dashboard"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Full-Screen Styled Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black text-white">{currentAmbulance?.callsign} Live Nav Path</span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Speed: 54 km/h | Heading: 084° E
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Destination:</span>
            <span className="font-bold text-emerald-400">
              {activeEmergency?.status === "TRANSPORTING" ? targetHospital?.name : activeEmergency?.address}
            </span>
          </div>
        </div>

        <div className="h-[580px] w-full">
          <LiveMap
            emergencies={activeEmergency ? [activeEmergency] : []}
            ambulances={currentAmbulance ? [currentAmbulance] : []}
            hospitals={targetHospital ? [targetHospital] : []}
            centerLat={currentAmbulance?.latitude || 40.7128}
            centerLng={currentAmbulance?.longitude || -74.006}
          />
        </div>
      </div>

    </div>
  );
};

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Leaflet Icons using SVG Data URIs
const createCustomIcon = (color, symbol) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5))">${svg}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const ambulanceIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:white;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(37,99,235,0.8);display:flex;align-items:center;justify-content:center;font-size:14px;">🚑</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const hospitalIcon = L.divIcon({
  html: `<div style="background:#9333ea;color:white;padding:6px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(147,51,234,0.8);display:flex;align-items:center;justify-content:center;font-size:14px;">🏥</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export const LiveMap = ({ emergencies = [], ambulances = [], hospitals = [], selectedEmergency = null, height = "450px" }) => {
  const defaultCenter = selectedEmergency 
    ? [selectedEmergency.latitude, selectedEmergency.longitude]
    : [40.730610, -73.935242]; // Default New York coordinates

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "#ef4444";
      case "HIGH": return "#f97316";
      case "MEDIUM": return "#eab308";
      default: return "#10b981";
    }
  };

  // Build active routing path if emergency is selected and assigned to an ambulance
  let routeCoordinates = [];
  if (selectedEmergency) {
    const assignedAmb = ambulances.find(a => a.id === selectedEmergency.assigned_ambulance_id);
    const targetHosp = hospitals.find(h => h.id === selectedEmergency.target_hospital_id);
    
    if (assignedAmb) {
      routeCoordinates.push([assignedAmb.latitude, assignedAmb.longitude]);
      routeCoordinates.push([selectedEmergency.latitude, selectedEmergency.longitude]);
    }
    if (targetHosp) {
      if (routeCoordinates.length === 0) {
        routeCoordinates.push([selectedEmergency.latitude, selectedEmergency.longitude]);
      }
      routeCoordinates.push([targetHosp.latitude, targetHosp.longitude]);
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl z-0 isolate" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "#090d16" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapRecenter center={defaultCenter} />

        {/* Emergencies */}
        {emergencies.map((e) => (
          <Marker
            key={`emergency-${e.id}`}
            position={[e.latitude, e.longitude]}
            icon={createCustomIcon(getPriorityColor(e.priority))}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-900 font-sans">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>🚨 Emergency #{e.id}</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded text-white font-bold uppercase" style={{ background: getPriorityColor(e.priority) }}>
                    {e.priority}
                  </span>
                </div>
                <div className="text-xs font-semibold mt-1">{e.emergency_type}</div>
                <div className="text-xs text-slate-600">{e.address}</div>
                <div className="text-[11px] mt-1 italic text-slate-500">{e.symptoms}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ambulances */}
        {ambulances.map((amb) => (
          <Marker
            key={`amb-${amb.id}`}
            position={[amb.latitude, amb.longitude]}
            icon={ambulanceIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <div className="font-bold text-sm">🚑 {amb.callsign}</div>
                <div className="text-xs text-slate-700 font-medium">Driver: {amb.driver_name}</div>
                <div className="text-xs text-slate-600">Type: {amb.type} | Status: <strong>{amb.status}</strong></div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospitals */}
        {hospitals.map((hosp) => (
          <Marker
            key={`hosp-${hosp.id}`}
            position={[hosp.latitude, hosp.longitude]}
            icon={hospitalIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900">
                <div className="font-bold text-sm">🏥 {hosp.name}</div>
                <div className="text-xs text-slate-700">{hosp.address}</div>
                <div className="text-xs font-semibold mt-1">
                  ER Beds: <span className="text-emerald-600">{hosp.available_er_beds}</span> / {hosp.total_er_beds} | 
                  ICU: <span className="text-purple-600">{hosp.available_icu_beds}</span> / {hosp.total_icu_beds}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Status: {hosp.er_status}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: "#f43f5e", weight: 4, dashArray: "8, 8", opacity: 0.8 }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg text-[11px] text-slate-300 space-y-1">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">Live Map Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
          <span>Critical Emergency</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>Ambulance Fleet</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          <span>Hospital ERs</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { 
  Siren, 
  MapPin, 
  Navigation, 
  Activity, 
  Users, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Truck, 
  Hospital, 
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";

export const EmergencyRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [emergencyType, setEmergencyType] = useState("Cardiac");
  const [symptoms, setSymptoms] = useState("");
  const [patientCount, setPatientCount] = useState(1);
  const [specialReqs, setSpecialReqs] = useState([]);
  const [address, setAddress] = useState("450 Lexington Ave, New York, NY");
  const [latitude, setLatitude] = useState(40.7516);
  const [longitude, setLongitude] = useState(-73.9754);
  const [callerPhone, setCallerPhone] = useState("+1 (555) 019-2831");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdEmergency, setCreatedEmergency] = useState(null);

  const emergencyTypes = [
    { type: "Cardiac", desc: "Chest pain, cardiac arrest, palpitations", color: "border-rose-500/50 bg-rose-950/30 text-rose-300" },
    { type: "Stroke", desc: "Facial droop, arm weakness, slurred speech", color: "border-purple-500/50 bg-purple-950/30 text-purple-300" },
    { type: "Trauma", desc: "Car crash, fall, deep lacerations, fractures", color: "border-amber-500/50 bg-amber-950/30 text-amber-300" },
    { type: "Respiratory", desc: "Severe asthma, asphyxiation, blue lips", color: "border-sky-500/50 bg-sky-950/30 text-sky-300" },
    { type: "Obstetric", desc: "Emergency labor, pregnancy complications", color: "border-pink-500/50 bg-pink-950/30 text-pink-300" },
    { type: "Allergic", desc: "Anaphylaxis, throat swelling, hives", color: "border-emerald-500/50 bg-emerald-950/30 text-emerald-300" },
    { type: "Burn", desc: "Thermal or chemical burns, smoke inhalation", color: "border-orange-500/50 bg-orange-950/30 text-orange-300" },
    { type: "Minor", desc: "Non-critical injury or mild symptoms", color: "border-slate-500/50 bg-slate-900 text-slate-300" },
  ];

  const availableRequirements = [
    "Oxygen Needed",
    "Ventilator Needed",
    "Pediatric",
    "Bariatric",
    "Defibrillator",
    "Spinal Immobilization"
  ];

  const handleToggleReq = (req) => {
    if (specialReqs.includes(req)) {
      setSpecialReqs(specialReqs.filter(r => r !== req));
    } else {
      setSpecialReqs([...specialReqs, req]);
    }
  };

  const handleDetectGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setAddress(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => {
          console.warn("GPS lookup failed, using simulated default coordinates.");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        caller_name: user?.full_name || "Emergency Caller",
        caller_phone: callerPhone,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        emergency_type: emergencyType,
        symptoms,
        patient_count: parseInt(patientCount, 10),
        special_requirements: specialReqs
      };

      const result = await api.createEmergency(payload);
      setCreatedEmergency(result);
    } catch (err) {
      setError(err.message || "Failed to submit emergency request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
          <Siren className="w-4 h-4 animate-pulse" />
          <span>Priority Emergency Dispatch Form</span>
        </div>
        <h1 className="text-2xl font-black text-white">
          Request Immediate Emergency Response
        </h1>
        <p className="text-xs text-slate-400">
          Provide essential information to help AI triage prioritize your case and deploy the optimal ambulance crew.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Confirmation View Post Submission */}
      {createdEmergency ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  DISPATCH CONFIRMED — INCIDENT #{createdEmergency.id}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                Emergency Successfully Created & AI Triaged
              </h2>
            </div>
          </div>

          {/* AI Triage Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Priority</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                createdEmergency.priority === "CRITICAL"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : createdEmergency.priority === "HIGH"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
              }`}>
                {createdEmergency.priority}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI Severity Score</span>
              <p className="text-2xl font-black text-rose-400">
                {createdEmergency.ai_severity_score}<span className="text-xs text-slate-500 font-normal">/100</span>
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Vehicle</span>
              <p className="text-lg font-black text-emerald-400">
                {createdEmergency.ai_recommended_type || "ALS (Advanced Life Support)"}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Dispatch ETA</span>
              <p className="text-lg font-bold text-white flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>3 - 6 Minutes</span>
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Hospital</span>
              <p className="text-sm font-bold text-white truncate flex items-center space-x-1.5">
                <Hospital className="w-4 h-4 text-purple-400" />
                <span>Metro General Trauma Center</span>
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {createdEmergency.status}
              </span>
            </div>

          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white block">AI Clinical Rationale:</span>
            <p className="text-slate-400">{createdEmergency.ai_urgency_reason}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/caller/tracking"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition text-center flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Track Assigned Ambulance in Real-Time</span>
            </Link>
            <Link
              to="/caller/dashboard"
              className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition text-center"
            >
              Return to Dashboard
            </Link>
          </div>

        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Emergency Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Select Emergency Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {emergencyTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setEmergencyType(item.type)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    emergencyType === item.type
                      ? "border-rose-500 bg-rose-950/60 shadow-md shadow-rose-500/20"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-extrabold text-white">{item.type}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              2. Describe Symptoms & Patient Condition
            </label>
            <textarea
              required
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., Severe crushing chest pain radiating to left arm, difficulty breathing, sweating heavily..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 text-xs rounded-2xl p-3.5 outline-none transition"
            />
          </div>

          {/* Patient Count & Special Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                3. Number of Casualties / Patients
              </label>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={patientCount}
                  onChange={(e) => setPatientCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Caller Phone Number
              </label>
              <input
                type="tel"
                required
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none"
              />
            </div>
          </div>

          {/* Special Requirements Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              4. Special Medical Equipment / Needs (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableRequirements.map((req) => {
                const selected = specialReqs.includes(req);
                return (
                  <button
                    key={req}
                    type="button"
                    onClick={() => handleToggleReq(req)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      selected
                        ? "bg-rose-600 border-rose-500 text-white shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {req}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & GPS */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                5. Emergency Incident Location
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="inline-flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Auto-Detect GPS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, landmarks..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Lat"
                  className="w-1/2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none font-mono text-center"
                />
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Lng"
                  className="w-1/2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-xl shadow-rose-600/30 transition uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Siren className="w-5 h-5" />
                <span>TRANSMIT EMERGENCY REQUEST (AI AUTO-TRIAGE)</span>
              </>
            )}
          </button>

        </form>
      )}

    </div>
  );
};

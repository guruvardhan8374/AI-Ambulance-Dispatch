import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { LiveMap } from "../common/LiveMap";
import { 
  Siren, 
  MapPin, 
  PhoneCall, 
  Users, 
  Stethoscope, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Navigation
} from "lucide-react";

export const CallerDashboard = () => {
  const [formData, setFormData] = useState({
    caller_name: "Sarah Jenkins",
    caller_phone: "+1 (555) 019-2831",
    address: "350 5th Ave, New York, NY 10118",
    latitude: 40.7484,
    longitude: -73.9857,
    emergency_type: "Cardiac",
    symptoms: "",
    patient_count: 1,
    special_requirements: []
  });

  const [activeEmergency, setActiveEmergency] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [emData, ambData, hospData] = await Promise.all([
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals()
      ]);
      setAmbulances(ambData);
      setHospitals(hospData);
      
      // Find latest pending or active emergency for this caller
      const latest = emData.find(e => e.status !== "RESOLVED" && e.status !== "CANCELLED");
      if (latest) {
        setActiveEmergency(latest);
      }
    } catch (e) {
      console.error("Error loading caller dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementToggle = (req) => {
    setFormData(prev => ({
      ...prev,
      special_requirements: prev.special_requirements.includes(req)
        ? prev.special_requirements.filter(r => r !== req)
        : [...prev.special_requirements, req]
    }));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: `GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          }));
        },
        (err) => alert("Could not fetch GPS. Using default location coordinates.")
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newEmergency = await api.createEmergency(formData);
      setActiveEmergency(newEmergency);
      fetchInitialData();
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const emergencyTypes = [
    { id: "Cardiac", label: "Heart Attack / Severe Chest Pain", icon: "❤️" },
    { id: "Stroke", label: "Stroke / Facial Drooping", icon: "🧠" },
    { id: "Trauma", label: "Severe Physical Injury / Accident", icon: "🩹" },
    { id: "Respiratory", label: "Breathing Distress / Asthma", icon: "🫁" },
    { id: "Obstetric", label: "Pregnancy / Labor Emergency", icon: "🤰" },
    { id: "Allergic", label: "Anaphylaxis / Severe Allergy", icon: "💉" },
    { id: "Burn", label: "Severe Burn Injury", icon: "🔥" },
    { id: "Minor", label: "Other Non-Life-Threatening", icon: "🩺" },
  ];

  const firstAidGuides = {
    Cardiac: [
      "Keep the patient calm and seated upright.",
      "Loosen any tight clothing around throat and chest.",
      "If trained and patient is unresponsive, begin Chest Compressions immediately (100-120 bpm).",
      "Do not give food or drink."
    ],
    Stroke: [
      "Note the exact time symptoms started (FAST: Face, Arms, Speech, Time).",
      "Lay the patient on their side to prevent choking if vomiting.",
      "Do NOT administer aspirin or medication."
    ],
    Trauma: [
      "Apply firm, direct pressure to any bleeding wounds with clean cloth.",
      "Do NOT move the patient if neck or spinal injury is suspected.",
      "Keep patient warm with a blanket."
    ],
    Respiratory: [
      "Assist patient into a comfortable sitting position.",
      "Help administer prescribed inhaler if available.",
      "Ensure space is well ventilated and crowd is kept back."
    ]
  };

  const assignedAmbulance = ambulances.find(a => a.id === activeEmergency?.assigned_ambulance_id);
  const assignedHospital = hospitals.find(h => h.id === activeEmergency?.target_hospital_id);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Siren className="w-64 h-64 text-rose-500" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Patient & Emergency Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Emergency Dispatch Request
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Automatic AI Severity Analysis, Nearest Ambulance Optimization, and Live GPS Emergency Dispatch Tracking.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <PhoneCall className="w-8 h-8 text-rose-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Direct HotLine</div>
              <div className="text-base font-black text-rose-400">911 / 112 Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Request Tracking Card (If Request Submitted) */}
      {activeEmergency ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl">
                <Activity className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-white">Emergency Request #{activeEmergency.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white uppercase ${
                    activeEmergency.priority === "CRITICAL" ? "bg-rose-600" :
                    activeEmergency.priority === "HIGH" ? "bg-orange-600" :
                    activeEmergency.priority === "MEDIUM" ? "bg-amber-600" : "bg-emerald-600"
                  }`}>
                    {activeEmergency.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{activeEmergency.address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-rose-400" />
              <div className="text-xs font-semibold text-slate-200">
                Status: <span className="text-rose-400 uppercase font-bold">{activeEmergency.status}</span>
              </div>
            </div>
          </div>

          {/* AI Decision Support Disclaimer Notice */}
          <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-4 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-blue-300">AI Severity Triage & Decision Support</div>
              <p className="text-xs text-slate-300 mt-0.5">{activeEmergency.ai_urgency_reason}</p>
              <div className="text-[10px] text-slate-400 italic mt-1">
                * Note: AI recommendations assist emergency response dispatchers and do not replace clinical paramedic evaluation.
              </div>
            </div>
          </div>

          {/* Assigned Ambulance & Hospital Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Assigned Ambulance Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-blue-400" /> Assigned Ambulance
                </span>
                {assignedAmbulance && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold">
                    {assignedAmbulance.type}
                  </span>
                )}
              </div>

              {assignedAmbulance ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold text-white">{assignedAmbulance.callsign}</div>
                  <div className="text-xs text-slate-300">Driver: <strong>{assignedAmbulance.driver_name}</strong></div>
                  <div className="text-xs text-slate-400">Phone: {assignedAmbulance.driver_phone}</div>
                  <div className="text-xs text-emerald-400 font-semibold pt-1">
                    Live GPS Location Active & Tracking on Map
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Dispatcher currently matching optimal available ambulance...
                </div>
              )}
            </div>

            {/* Target Hospital Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" /> Receiving Hospital
                </span>
                {assignedHospital && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-bold">
                    {assignedHospital.er_status}
                  </span>
                )}
              </div>

              {assignedHospital ? (
                <div className="space-y-2">
                  <div className="text-base font-bold text-white">{assignedHospital.name}</div>
                  <div className="text-xs text-slate-300">{assignedHospital.address}</div>
                  <div className="text-xs text-purple-300">
                    Beds Free: {assignedHospital.available_er_beds} ER | {assignedHospital.available_icu_beds} ICU
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Hospital coordination in progress...
                </div>
              )}
            </div>

          </div>

          {/* Live GPS Map */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Ambulance & Emergency Map</h3>
            <LiveMap
              emergencies={[activeEmergency]}
              ambulances={ambulances}
              hospitals={hospitals}
              selectedEmergency={activeEmergency}
              height="380px"
            />
          </div>

          {/* First Aid Instructions */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-400" /> 
              Pre-Arrival First Aid Guidance ({activeEmergency.emergency_type})
            </h3>
            <ul className="space-y-2">
              {(firstAidGuides[activeEmergency.emergency_type] || firstAidGuides.Cardiac).map((step, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-rose-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      ) : (
        /* Emergency Submission Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Siren className="w-5 h-5 text-rose-500" /> Create Emergency SOS Request
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Fill in details below to alert dispatch command center immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={detectLocation}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Auto GPS</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Caller Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Caller Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.caller_name}
                    onChange={(e) => setFormData({ ...formData, caller_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.caller_phone}
                    onChange={(e) => setFormData({ ...formData, caller_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Emergency Address */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Emergency Address / Location</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {/* Emergency Type Grid */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Select Emergency Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {emergencyTypes.map((type) => {
                    const isSelected = formData.emergency_type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, emergency_type: type.id })}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? "bg-rose-950/60 border-rose-500 text-white shadow-lg"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xl mb-1">{type.icon}</span>
                        <span className="text-xs font-bold leading-snug">{type.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symptoms Text */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Symptoms / Incident Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe patient condition, consciousness state, breathing, or injuries..."
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Patient Count & Special Needs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Number of Patients</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.patient_count}
                    onChange={(e) => setFormData({ ...formData, patient_count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Special Requirements</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["Pediatric", "Bariatric", "Oxygen Needed", "Ventilator Needed"].map((req) => {
                      const active = formData.special_requirements.includes(req);
                      return (
                        <button
                          key={req}
                          type="button"
                          onClick={() => handleRequirementToggle(req)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                            active
                              ? "bg-rose-600 border-rose-500 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {req}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-2xl shadow-xl border border-rose-500/40 transition flex items-center justify-center space-x-2"
              >
                <Siren className="w-5 h-5 animate-pulse" />
                <span>{submitting ? "Transmitting Emergency SOS..." : "SUBMIT EMERGENCY SOS REQUEST"}</span>
              </button>

            </form>
          </div>

          {/* Side Info & Map Preview */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Area Coverage</h3>
              <LiveMap
                emergencies={[]}
                ambulances={ambulances}
                hospitals={hospitals}
                height="280px"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-400" /> AI Classification Preview
              </h3>
              <p className="text-xs text-slate-300">
                Our AI Triage system will analyze your symptoms, auto-assign severity priority, match required paramedic equipment, and dispatch the nearest capable ambulance within seconds.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

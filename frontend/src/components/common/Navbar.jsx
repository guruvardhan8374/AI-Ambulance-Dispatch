import React, { useState } from "react";
import { useAuth, DEMO_USERS } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { api } from "../../services/api";
import { 
  Siren, 
  ShieldAlert, 
  Truck, 
  Hospital, 
  Radio, 
  BarChart3, 
  Bell, 
  Wifi, 
  WifiOff, 
  User, 
  LogOut, 
  KeyRound,
  UserPlus
} from "lucide-react";

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, switchRole, logout, login } = useAuth();
  const { isConnected, notifications, clearNotifications } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("LOGIN"); // LOGIN or REGISTER
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("CALLER");
  const [authError, setAuthError] = useState("");

  const roleIcons = {
    CALLER: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
    DRIVER: <Truck className="w-4 h-4 text-blue-400" />,
    HOSPITAL: <Hospital className="w-4 h-4 text-purple-400" />,
    DISPATCHER: <Radio className="w-4 h-4 text-rose-400" />,
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === "REGISTER") {
        await api.register({
          email: authEmail,
          password: authPassword,
          full_name: authName,
          role: authRole
        });
        // Auto login after registration
        await login(authEmail, authPassword);
      } else {
        await login(authEmail, authPassword);
      }
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-[1100] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab(user?.role || "DISPATCHER")}>
            <div className="p-2.5 bg-rose-600/20 border border-rose-500/40 rounded-xl flex items-center justify-center animate-pulse-fast">
              <Siren className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-rose-400 bg-clip-text text-transparent">
                  RESPONSAI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  AI DISPATCH 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Emergency Ambulance Coordination Platform
              </p>
            </div>
          </div>

          {/* Quick Role Selector Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {Object.keys(DEMO_USERS).map((roleKey) => {
              const isActive = user?.role === roleKey && currentTab !== "ANALYTICS";
              return (
                <button
                  key={roleKey}
                  onClick={() => {
                    setCurrentTab(roleKey);
                    switchRole(roleKey);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  {roleIcons[roleKey]}
                  <span>
                    {roleKey === "CALLER" ? "Patient SOS" : 
                     roleKey === "DRIVER" ? "Paramedic" : 
                     roleKey === "HOSPITAL" ? "Hospital ER" : "Command Center"}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setCurrentTab("ANALYTICS")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === "ANALYTICS"
                  ? "bg-rose-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Right Status Controls & Notifications */}
          <div className="flex items-center space-x-3">
            
            {/* WebSocket Connection Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected 
                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400" 
                : "bg-amber-950/60 border-amber-500/30 text-amber-400"
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isConnected ? "Live Socket" : "Connecting..."}</span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[1200] overflow-hidden">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-slate-200">System Notifications</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-400 hover:text-rose-400"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-800/40 transition">
                          <p className="text-xs text-slate-200 font-medium">{n.text}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Login/Register Button or User Info */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <User className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">{user ? user.full_name : "Account Login"}</span>
            </button>

          </div>

        </div>
      </div>

      {/* Login & Registration Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {authMode === "LOGIN" ? <KeyRound className="w-5 h-5 text-rose-500" /> : <UserPlus className="w-5 h-5 text-emerald-500" />}
                <h3 className="text-base font-bold text-white">
                  {authMode === "LOGIN" ? "JWT Account Login" : "Register New Role Account"}
                </h3>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "REGISTER" && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Dr. Alex Rivera"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="user@emergency.net"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5"
                />
              </div>

              {authMode === "REGISTER" && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Select User Role</label>
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 font-bold"
                  >
                    <option value="CALLER">Patient / Caller</option>
                    <option value="DRIVER">Paramedic / Driver</option>
                    <option value="HOSPITAL">Hospital Staff</option>
                    <option value="DISPATCHER">Emergency Dispatcher</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow transition"
              >
                {authMode === "LOGIN" ? "AUTHENTICATE JWT LOGIN" : "CREATE ACCOUNT & LOGIN"}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              {authMode === "LOGIN" ? (
                <span>Need a new role account? <button onClick={() => { setAuthMode("REGISTER"); setAuthError(""); }} className="text-rose-400 font-bold hover:underline">Register here</button></span>
              ) : (
                <span>Already have an account? <button onClick={() => { setAuthMode("LOGIN"); setAuthError(""); }} className="text-rose-400 font-bold hover:underline">Login here</button></span>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

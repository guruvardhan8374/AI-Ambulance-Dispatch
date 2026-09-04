import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import { 
  Siren, 
  ShieldAlert, 
  Truck, 
  Hospital, 
  Radio, 
  Bell, 
  Wifi, 
  WifiOff, 
  User, 
  LogOut, 
  ChevronDown
} from "lucide-react";

export const RoleHeader = ({ roleTitle, roleBadgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/30" }) => {
  const { user, logout } = useAuth();
  const { isConnected, notifications, clearNotifications } = useWebSocket();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleIcons = {
    CALLER: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
    DRIVER: <Truck className="w-4 h-4 text-blue-400" />,
    HOSPITAL: <Hospital className="w-4 h-4 text-purple-400" />,
    DISPATCHER: <Radio className="w-4 h-4 text-rose-400" />,
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-[1100] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Portal Role Badge */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600/20 border border-rose-500/40 rounded-xl flex items-center justify-center">
              <Siren className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-rose-400 bg-clip-text text-transparent">
                  RESPONSAI
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${roleBadgeColor}`}>
                  {roleTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Emergency Dispatch & Response System
              </p>
            </div>
          </div>

          {/* Right Status Controls, Notifications & Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Live Socket Status */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected 
                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400" 
                : "bg-amber-950/60 border-amber-500/30 text-amber-400"
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isConnected ? "Live Sync Active" : "Reconnecting..."}</span>
            </div>

            {/* Notification Drawer Button */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition cursor-pointer"
                title="System Notifications"
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
                      <span className="text-xs font-bold text-slate-200">Live Notifications</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
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
                        <div key={n.id} className="p-3 hover:bg-slate-800/40 transition text-left">
                          <p className="text-xs text-slate-200 font-medium">{n.text}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Logout Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                {roleIcons[user?.role] || <User className="w-4 h-4 text-rose-400" />}
                <span className="hidden sm:inline font-bold">{user ? user.full_name : "User Profile"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[1200] overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 text-left">
                    <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                      ROLE: {user?.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { RoleHeader } from "../common/RoleHeader";
import { useAuth } from "../../context/AuthContext";
import { 
  Home, 
  Siren, 
  History, 
  MapPin, 
  User, 
  LogOut, 
  ShieldAlert,
  PhoneCall
} from "lucide-react";

export const CallerLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { to: "/caller/dashboard", label: "Home / Status", icon: Home, end: true },
    { to: "/caller/request", label: "Request Emergency (SOS)", icon: Siren, highlight: true },
    { to: "/caller/tracking", label: "Live Tracking", icon: MapPin },
    { to: "/caller/history", label: "Emergency History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <RoleHeader 
        roleTitle="PATIENT / CALLER PORTAL" 
        roleBadgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30" 
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Caller Dedicated Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* Quick SOS Card */}
          <div className="bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/40 rounded-2xl p-4 shadow-xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center animate-bounce">
              <PhoneCall className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Emergency Services</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct 911 / Medical Dispatch</p>
            </div>
            <NavLink
              to="/caller/request"
              className="block w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition uppercase tracking-wider text-center"
            >
              🚨 REQUEST SOS NOW
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 shadow-xl space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Patient Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : item.highlight
                        ? "text-rose-400 hover:bg-rose-950/40"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="border-t border-slate-800/80 pt-2 mt-2 space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Account & Security
              </div>
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">{user?.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>

        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

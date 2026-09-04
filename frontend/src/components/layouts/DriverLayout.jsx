import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { RoleHeader } from "../common/RoleHeader";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  Target, 
  PhoneIncoming, 
  Navigation as NavIcon, 
  History, 
  User, 
  LogOut, 
  Truck
} from "lucide-react";

export const DriverLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { to: "/driver/dashboard", label: "Driver Dashboard", icon: LayoutDashboard, end: true },
    { to: "/driver/mission", label: "Active Mission", icon: Target },
    { to: "/driver/calls", label: "Available Calls", icon: PhoneIncoming },
    { to: "/driver/navigation", label: "GPS Navigation", icon: NavIcon },
    { to: "/driver/history", label: "Shift History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <RoleHeader 
        roleTitle="PARAMEDIC / DRIVER CONSOLE" 
        roleBadgeColor="text-blue-400 bg-blue-500/10 border-blue-500/30" 
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Paramedic Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* Driver Unit Badge */}
          <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/40 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Field Unit Active</p>
                <p className="text-[11px] text-blue-400 font-mono font-medium">GPS Telemetry Online</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 shadow-xl space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Paramedic Console
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
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
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
                Driver Profile
              </div>
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-blue-400" />
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

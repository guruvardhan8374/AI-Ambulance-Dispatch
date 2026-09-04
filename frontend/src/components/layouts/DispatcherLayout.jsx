import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { RoleHeader } from "../common/RoleHeader";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Truck, 
  Hospital, 
  Cpu, 
  Map, 
  BarChart3, 
  ScrollText, 
  Settings, 
  User, 
  LogOut, 
  Radio
} from "lucide-react";

export const DispatcherLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { to: "/dispatcher/dashboard", label: "Command Center", icon: LayoutDashboard, end: true },
    { to: "/dispatcher/emergencies", label: "Active Emergencies", icon: AlertCircle },
    { to: "/dispatcher/fleet", label: "Ambulance Fleet", icon: Truck },
    { to: "/dispatcher/hospitals", label: "Hospital Network", icon: Hospital },
    { to: "/dispatcher/ai-dispatch", label: "AI Dispatch Hub", icon: Cpu },
    { to: "/dispatcher/map", label: "Tactical Live Map", icon: Map },
    { to: "/dispatcher/analytics", label: "Analytics & Reports", icon: BarChart3 },
    { to: "/dispatcher/logs", label: "Dispatch Audit Logs", icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      <RoleHeader 
        roleTitle="EMERGENCY DISPATCH COMMAND CENTER" 
        roleBadgeColor="text-rose-400 bg-rose-500/10 border-rose-500/30" 
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Dispatcher Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* Dispatcher Command Center Badge */}
          <div className="bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/40 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-white leading-tight">CENTRAL 911</p>
                <p className="text-[11px] text-rose-400 font-mono font-medium">AI Triage Active</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 shadow-xl space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Dispatcher Console
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
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
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
                Dispatcher Profile
              </div>
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-rose-400" />
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

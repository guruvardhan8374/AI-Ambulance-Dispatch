import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft, Home, Lock, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const UnauthorizedPage = ({ requiredRoles = [], userRole }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardUrl = (role) => {
    switch (role) {
      case "CALLER":
        return "/caller/dashboard";
      case "DRIVER":
        return "/driver/dashboard";
      case "HOSPITAL":
        return "/hospital/dashboard";
      case "DISPATCHER":
        return "/dispatcher/dashboard";
      default:
        return "/login";
    }
  };

  const userDashboard = getDashboardUrl(user?.role || userRole);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-lg w-full bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10 animate-pulse">
          <ShieldX className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>403 Access Forbidden</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Role Permission Required
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Your authenticated account (<span className="font-semibold text-rose-400">{user?.role || userRole}</span>) is not authorized to access this department console.
          </p>
        </div>

        {requiredRoles.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
              Required Role Clearances:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {requiredRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to={userDashboard}
            className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Go to My Dashboard ({user?.role || userRole})</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="inline-flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Role / Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

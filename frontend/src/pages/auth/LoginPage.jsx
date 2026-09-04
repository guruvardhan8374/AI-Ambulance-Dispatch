import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, DEMO_USERS } from "../../context/AuthContext";
import { Siren, KeyRound, ShieldAlert, Truck, Hospital, Radio, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        return "/";
    }
  };

  const handleLogin = async (loginEmail, loginPassword) => {
    setError("");
    setLoading(true);
    try {
      const loggedUser = await login(loginEmail, loginPassword);
      const targetUrl = location.state?.from?.pathname || getDashboardUrl(loggedUser.role);
      navigate(targetUrl, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to authenticate. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleQuickDemo = (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      handleLogin(demo.email, demo.password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-rose-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex p-3 bg-rose-600/20 border border-rose-500/40 rounded-2xl animate-pulse">
          <Siren className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-rose-400 bg-clip-text text-transparent">
          RESPONSAI
        </h2>
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
          AI-Driven Emergency Ambulance Dispatch & Operational Coordination
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-rose-500" />
              <span>JWT Role-Based Authentication</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in to enter your assigned emergency dashboard
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dispatcher@controlcenter.gov"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>AUTHENTICATE & ENTER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Quick Demo Sign-in */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute">
                Quick Role Demo Accounts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("CALLER")}
                className="p-2.5 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Patient / Caller</span>
                </div>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-0.5 font-mono">
                  caller@emergency.net
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("DRIVER")}
                className="p-2.5 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-bold">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Driver / Medic</span>
                </div>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-0.5 font-mono">
                  driver1@dispatch.net
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("HOSPITAL")}
                className="p-2.5 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-purple-400 text-xs font-bold">
                  <Hospital className="w-3.5 h-3.5" />
                  <span>Hospital Staff</span>
                </div>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-0.5 font-mono">
                  hospital1@metrohealth.org
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("DISPATCHER")}
                className="p-2.5 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 rounded-xl text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Dispatcher</span>
                </div>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-0.5 font-mono">
                  dispatcher@controlcenter.gov
                </p>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Need a new account?{" "}
            <Link to="/register" className="text-rose-400 font-bold hover:underline">
              Register here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

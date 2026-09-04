import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Siren, UserPlus, ShieldAlert, Truck, Hospital, Radio, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CALLER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getDashboardUrl = (userRole) => {
    switch (userRole) {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        phone,
        role: role.toUpperCase()
      });

      // Auto-login upon registration
      const loggedUser = await login(email, password);
      navigate(getDashboardUrl(loggedUser.role), { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please check form inputs.");
    } finally {
      setLoading(false);
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
          Create a New Certified Role Account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Register Platform Account</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your agency or patient role for custom dashboard provisioning
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jordan Hayes"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.hayes@medcenter.org"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Assign Operational Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "CALLER", label: "Caller / Patient", icon: ShieldAlert, color: "text-emerald-400" },
                  { key: "DRIVER", label: "Driver / Medic", icon: Truck, color: "text-blue-400" },
                  { key: "HOSPITAL", label: "Hospital Staff", icon: Hospital, color: "text-purple-400" },
                  { key: "DISPATCHER", label: "Dispatcher", icon: Radio, color: "text-rose-400" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRole(item.key)}
                      className={`p-3 rounded-xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 border-rose-500 shadow-md shadow-rose-500/10"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-xs font-bold text-slate-200">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2 cursor-pointer pt-3"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>CREATE ACCOUNT & ENTER DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-rose-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { 
  BarChart3, 
  Clock, 
  Truck, 
  Hospital, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert 
} from "lucide-react";

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (e) {
      console.error("Error loading analytics data", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-400">
        Loading emergency dispatch analytics...
      </div>
    );
  }

  const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#eab308"];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Analytics Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-rose-600/20 border border-rose-500/40 rounded-2xl">
            <BarChart3 className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Emergency Response Analytics</h1>
            <p className="text-xs text-slate-300 mt-0.5">Real-time performance metrics, dispatch benchmarks, and hospital bed occupancy</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">System Benchmark Score: <strong className="text-emerald-400">94.8%</strong></span>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Avg Response Time</span>
            <Clock className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white">{data.avg_response_time_minutes} <span className="text-xs font-normal text-slate-400">mins</span></div>
          <p className="text-[11px] text-emerald-400 font-medium">↓ 1.2 mins faster than target SLA</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Avg AI Dispatch Time</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{data.avg_dispatch_time_minutes} <span className="text-xs font-normal text-slate-400">mins</span></div>
          <p className="text-[11px] text-blue-400 font-medium">⚡ AI automated recommendation speed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Fleet Utilization</span>
            <Truck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{data.fleet_utilization.utilization_rate}%</div>
          <p className="text-[11px] text-slate-400">{data.fleet_utilization.dispatched + data.fleet_utilization.on_scene + data.fleet_utilization.transporting} of {data.fleet_utilization.total_ambulances} active vehicles</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">ICU Bed Occupancy</span>
            <Hospital className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{data.hospital_bed_occupancy.icu_occupancy_percent}%</div>
          <p className="text-[11px] text-purple-300 font-medium">{data.hospital_bed_occupancy.available_icu_beds} ICU Beds Available regional</p>
        </div>

      </div>

      {/* Recharts Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Response Time by Priority Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400" /> Average Response Time by Priority (Minutes)
          </h2>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.response_by_priority}>
                <XAxis dataKey="priority" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="avg_response_minutes" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emergency Category Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Emergency Incident Categories
          </h2>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {data.category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";
import {
  BarChart3,
  Clock,
  Truck,
  Hospital,
  Activity,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const CHART_COLORS = ["#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#eab308"];
const tooltipStyle = { backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" };

const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-slate-800 rounded" />
            <div className="h-4 w-4 bg-slate-800 rounded" />
          </div>
          <div className="h-8 w-20 bg-slate-800 rounded" />
          <div className="h-3 w-32 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="h-4 w-48 bg-slate-800 rounded" />
          <div className="h-64 bg-slate-800/60 rounded-2xl" />
        </div>
      ))}
    </div>
  </div>
);

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getAnalyticsOverview();
      setData(res);
    } catch (e) {
      console.error("Error loading analytics data", e);
      setError(e.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Operational Intelligence &amp; KPIs</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-0.5">Emergency Performance Analytics</h1>
            <p className="text-xs text-slate-400">Loading operational metrics...</p>
          </div>
          <Link to="/dispatcher/dashboard" className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Command Center</span>
          </Link>
        </div>
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-white">Emergency Performance Analytics</h1>
          <Link to="/dispatcher/dashboard" className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition">
            <ArrowLeft className="w-4 h-4" /><span>Back</span>
          </Link>
        </div>
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex flex-col items-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-sm text-rose-300 font-semibold">{error || "Failed to load analytics."}</p>
          <button onClick={fetchAnalytics} className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer">
            <RefreshCw className="w-4 h-4" /><span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Build fleet status chart data from fleet_utilization breakdown
  const fleetPieData = [
    { name: "Available", value: data.fleet_utilization.available, color: "#10b981" },
    { name: "Dispatched", value: data.fleet_utilization.dispatched, color: "#3b82f6" },
    { name: "On Scene", value: data.fleet_utilization.on_scene, color: "#f97316" },
    { name: "Transporting", value: data.fleet_utilization.transporting, color: "#8b5cf6" },
    { name: "Maintenance", value: data.fleet_utilization.maintenance, color: "#64748b" },
  ].filter((d) => d.value > 0);

  // Hospital bed occupancy chart data
  const bedOccupancyData = [
    {
      name: "ER Beds",
      Occupied: data.hospital_bed_occupancy.total_er_beds - data.hospital_bed_occupancy.available_er_beds,
      Available: data.hospital_bed_occupancy.available_er_beds,
    },
    {
      name: "ICU Beds",
      Occupied: data.hospital_bed_occupancy.total_icu_beds - data.hospital_bed_occupancy.available_icu_beds,
      Available: data.hospital_bed_occupancy.available_icu_beds,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Operational Intelligence &amp; KPIs</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">
            Emergency Performance Analytics
          </h1>
          <p className="text-xs text-slate-400">
            System response SLAs, triage category distributions, fleet utilization, and hospital bed load.
          </p>
        </div>

        <Link
          to="/dispatcher/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Center</span>
        </Link>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Emergency Volume</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-white">{data.total_emergencies}</p>
          <span className="text-xs text-rose-400 font-semibold">{data.active_emergencies} Active Right Now</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Arrival Time</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {data.avg_response_time_minutes} <span className="text-sm font-normal text-slate-400">mins</span>
          </p>
          <span className="text-xs text-emerald-400">SLA Benchmark: &lt; 9.0 mins</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Utilization</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">{data.fleet_utilization.utilization_rate}%</p>
          <span className="text-xs text-slate-400">{data.fleet_utilization.available} units currently available</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ER Bed Occupancy</span>
            <Hospital className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400">{data.hospital_bed_occupancy.er_occupancy_percent}%</p>
          <span className="text-xs text-slate-400">{data.hospital_bed_occupancy.available_er_beds} available ER beds</span>
        </div>

      </div>

      {/* 2×2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Response Times by Priority */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Avg. Arrival Time by Priority (Minutes)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">From emergency creation to on-scene arrival</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.response_by_priority}>
                <XAxis dataKey="priority" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg_response_minutes" name="Avg. Minutes" fill="#e11d48" radius={[8, 8, 0, 0]}>
                  {data.response_by_priority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Emergency Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Emergency Incident Classification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution by emergency type category</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Fleet Utilization Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Fleet Status Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time ambulance operational status distribution</p>
          </div>
          <div className="h-64 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={fleetPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                  >
                    {fleetPieData.map((entry, index) => (
                      <Cell key={`fleet-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2.5 pl-2">
              {fleetPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                    <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-500">
                  Total: <strong className="text-white">{data.fleet_utilization.total_ambulances}</strong> units
                  &nbsp;•&nbsp;
                  <strong className="text-blue-400">{data.fleet_utilization.utilization_rate}%</strong> utilized
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Hospital Bed Occupancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Hospital Bed Occupancy (Network-Wide)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ER and ICU bed utilization across all networked hospitals</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bedOccupancyData} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={65} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="Occupied" name="Occupied" fill="#e11d48" radius={[0, 6, 6, 0]} stackId="a" />
                <Bar dataKey="Available" name="Available" fill="#10b981" radius={[0, 6, 6, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">ICU Occupancy</p>
              <p className="text-xl font-black text-rose-400">{data.hospital_bed_occupancy.icu_occupancy_percent}%</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Available ICU</p>
              <p className="text-xl font-black text-emerald-400">{data.hospital_bed_occupancy.available_icu_beds}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

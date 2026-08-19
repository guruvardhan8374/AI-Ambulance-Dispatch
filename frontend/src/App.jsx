import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { Navbar } from "./components/common/Navbar";
import { CallerDashboard } from "./components/caller/CallerDashboard";
import { DriverDashboard } from "./components/driver/DriverDashboard";
import { HospitalDashboard } from "./components/hospital/HospitalDashboard";
import { DispatcherDashboard } from "./components/dispatcher/DispatcherDashboard";
import { AnalyticsPage } from "./components/analytics/AnalyticsPage";

const MainContent = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState("DISPATCHER");

  // Determine active view: custom tab if selected (like Analytics), else user's role dashboard
  const activeView = currentTab === "ANALYTICS" ? "ANALYTICS" : (user?.role || "DISPATCHER");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white pb-12">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="transition-all duration-300">
        {activeView === "CALLER" && <CallerDashboard />}
        {activeView === "DRIVER" && <DriverDashboard />}
        {activeView === "HOSPITAL" && <HospitalDashboard />}
        {activeView === "DISPATCHER" && <DispatcherDashboard />}
        {activeView === "ANALYTICS" && <AnalyticsPage />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}

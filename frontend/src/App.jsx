import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { UnauthorizedPage } from "./pages/auth/UnauthorizedPage";

// Layouts
import { CallerLayout } from "./components/layouts/CallerLayout";
import { DriverLayout } from "./components/layouts/DriverLayout";
import { HospitalLayout } from "./components/layouts/HospitalLayout";
import { DispatcherLayout } from "./components/layouts/DispatcherLayout";

// Caller Pages
import { CallerDashboard } from "./pages/caller/CallerDashboard";
import { EmergencyRequest } from "./pages/caller/EmergencyRequest";
import { EmergencyTracking } from "./pages/caller/EmergencyTracking";
import { EmergencyHistory } from "./pages/caller/EmergencyHistory";

// Driver Pages
import { DriverDashboard } from "./pages/driver/DriverDashboard";
import { ActiveMission } from "./pages/driver/ActiveMission";
import { Navigation } from "./pages/driver/Navigation";
import { DriverHistory } from "./pages/driver/DriverHistory";

// Hospital Pages
import { HospitalDashboard } from "./pages/hospital/HospitalDashboard";
import { IncomingAmbulances } from "./pages/hospital/IncomingAmbulances";
import { HospitalCapacity } from "./pages/hospital/HospitalCapacity";
import { HospitalStatus } from "./pages/hospital/HospitalStatus";

// Dispatcher Pages
import { DispatcherDashboard } from "./pages/dispatcher/DispatcherDashboard";
import { ActiveEmergencies } from "./pages/dispatcher/ActiveEmergencies";
import { FleetManagement } from "./pages/dispatcher/FleetManagement";
import { HospitalNetwork } from "./pages/dispatcher/HospitalNetwork";
import { AIDispatch } from "./pages/dispatcher/AIDispatch";
import { LiveCommandMap } from "./pages/dispatcher/LiveCommandMap";
import { Analytics } from "./pages/dispatcher/Analytics";
import { AuditLogs } from "./pages/dispatcher/AuditLogs";

// Root Redirector based on authenticated role
const RootRedirector = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading RESPONSAI platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "CALLER":
      return <Navigate to="/caller/dashboard" replace />;
    case "DRIVER":
      return <Navigate to="/driver/dashboard" replace />;
    case "HOSPITAL":
      return <Navigate to="/hospital/dashboard" replace />;
    case "DISPATCHER":
      return <Navigate to="/dispatcher/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Root Route */}
            <Route path="/" element={<RootRedirector />} />

            {/* 1. CALLER / PATIENT DASHBOARD & ROUTES */}
            <Route
              path="/caller"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["CALLER"]}>
                    <CallerLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/caller/dashboard" replace />} />
              <Route path="dashboard" element={<CallerDashboard />} />
              <Route path="request" element={<EmergencyRequest />} />
              <Route path="tracking" element={<EmergencyTracking />} />
              <Route path="history" element={<EmergencyHistory />} />
            </Route>

            {/* 2. DRIVER / PARAMEDIC DASHBOARD & ROUTES */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["DRIVER"]}>
                    <DriverLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/driver/dashboard" replace />} />
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="mission" element={<ActiveMission />} />
              <Route path="calls" element={<ActiveMission />} />
              <Route path="navigation" element={<Navigation />} />
              <Route path="history" element={<DriverHistory />} />
            </Route>

            {/* 3. HOSPITAL STAFF DASHBOARD & ROUTES */}
            <Route
              path="/hospital"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["HOSPITAL"]}>
                    <HospitalLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/hospital/dashboard" replace />} />
              <Route path="dashboard" element={<HospitalDashboard />} />
              <Route path="incoming" element={<IncomingAmbulances />} />
              <Route path="capacity" element={<HospitalCapacity />} />
              <Route path="status" element={<HospitalStatus />} />
              <Route path="queue" element={<IncomingAmbulances />} />
            </Route>

            {/* 4. EMERGENCY DISPATCHER COMMAND CENTER & ROUTES */}
            <Route
              path="/dispatcher"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["DISPATCHER"]}>
                    <DispatcherLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dispatcher/dashboard" replace />} />
              <Route path="dashboard" element={<DispatcherDashboard />} />
              <Route path="emergencies" element={<ActiveEmergencies />} />
              <Route path="fleet" element={<FleetManagement />} />
              <Route path="hospitals" element={<HospitalNetwork />} />
              <Route path="ai-dispatch" element={<AIDispatch />} />
              <Route path="map" element={<LiveCommandMap />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="logs" element={<AuditLogs />} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}

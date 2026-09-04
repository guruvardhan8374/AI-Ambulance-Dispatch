import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UnauthorizedPage } from "../pages/auth/UnauthorizedPage";
import { Loader2 } from "lucide-react";

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">Verifying Security Clearances...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <UnauthorizedPage requiredRoles={allowedRoles} userRole={user.role} />;
  }

  return children;
};

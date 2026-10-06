import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Guards a route: requires login, and optionally restricts to specific roles.
// Usage: <ProtectedRoute roles={["DOCTOR"]}><DoctorDashboard /></ProtectedRoute>
export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

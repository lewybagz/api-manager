import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow children to be passed for element-based routing
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    // You might want to show a loading spinner here instead of null
    return <div>Loading authentication status...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If children are provided (for element-based routing like <ProtectedRoute><DashboardPage /></ProtectedRoute>)
  // render them. Otherwise, render an <Outlet /> (for nested routes defined within App.tsx).
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

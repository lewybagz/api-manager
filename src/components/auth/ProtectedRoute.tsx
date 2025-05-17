import { Loader2 } from "lucide-react";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import useAuthStore from "../../stores/authStore";

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow children to be passed for element-based routing
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, user } = useAuthStore();

  if (isLoading) {
    // You might want to show a loading spinner here instead of null
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 mr-2 animate-spin" />
        <p className="text-sm text-gray-500">Vibe Checking...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  // If children are provided (for element-based routing like <ProtectedRoute><DashboardPage /></ProtectedRoute>)
  // render them. Otherwise, render an <Outlet /> (for nested routes defined within App.tsx).
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

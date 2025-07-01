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
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 mr-2 animate-spin" />
        <p className="text-md text-gray-500">Vibe Checking...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

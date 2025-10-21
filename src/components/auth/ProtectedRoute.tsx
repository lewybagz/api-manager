import { Loader2 } from "lucide-react";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import useAuthStore from "../../stores/authStore";

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow children to be passed for element-based routing
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, user } = useAuthStore();
  const appType =
    (typeof window !== "undefined" &&
      (localStorage.getItem("appType") ||
        (location.pathname.startsWith("/pw") ? "pw" : "api"))) ||
    "api";

  if (isLoading) {
    if (appType === "pw") {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pw-bg-3 to-pw-bg-1 text-white">
          <Loader2 className="h-10 w-10 mr-2 animate-spin" />
          <p className="mt-3 text-md">Making sure the app is not broken…</p>
        </div>
      );
    }
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

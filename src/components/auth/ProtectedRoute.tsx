import { Loader2 } from "lucide-react";
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import useAuthStore from "../../stores/authStore";

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow children to be passed for element-based routing
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, user } = useAuthStore();
  const location = useLocation();
  const appType =
    (typeof window !== "undefined" &&
      (localStorage.getItem("appType") ||
        (location.pathname.startsWith("/pw") ? "pw" : "api"))) ||
    "api";

  if (isLoading) {
    if (appType === "pw") {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-zk-base font-zk-sans text-zk-text">
          <Loader2 className="h-10 w-10 animate-spin text-rose-400" />
          <p className="mt-3 text-sm text-zk-muted">Loading…</p>
        </div>
      );
    }
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zk-base font-zk-sans text-zk-text">
        <Loader2 className="h-10 w-10 animate-spin text-zk-indigo" />
        <p className="mt-3 text-sm text-zk-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    const to = location.pathname.startsWith("/pw") ? "/pw/login" : "/login";
    return <Navigate replace to={to} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

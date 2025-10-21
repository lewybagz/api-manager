import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import useUserStore from "../../stores/userStore";

interface PasswordAppGuardProps {
  children: React.ReactNode;
}

const PasswordAppGuard: React.FC<PasswordAppGuardProps> = ({ children }) => {
  const { isLoading, userDoc } = useUserStore();
  const location = useLocation();

  if (isLoading) return null;

  const type = userDoc?.appType ?? "api";
  if (type !== "pw") {
    return (
      <Navigate replace state={{ from: location.pathname }} to="/dashboard" />
    );
  }

  return <>{children}</>;
};

export default PasswordAppGuard;

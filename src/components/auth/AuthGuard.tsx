import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ErrorCategory, logger } from "../../services/logger";
import useAuthStore from "../../stores/authStore";

/**
 * Authentication Guard component that redirects unauthenticated users to the login page
 * This component does not render anything itself - it only performs the redirect logic
 */
const AuthGuard = () => {
  const { isLoading, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const isPublicRoute =
    currentPath === "/" ||
    currentPath === "/login" ||
    currentPath === "/forgot-password" ||
    currentPath.startsWith("/docs") ||
    currentPath.startsWith("/pro");

  useEffect(() => {
    // Skip redirection if still loading or on a public route
    if (isLoading || isPublicRoute) {
      return;
    }

    // If user is not authenticated, redirect to login
    if (!user) {
      logger.info(
        ErrorCategory.AUTH,
        "Redirecting unauthenticated user to login",
        {
          action: "authRedirect",
          from: currentPath,
        }
      );

      // Use replace instead of push to avoid building up history
      void navigate("/login", { replace: true });
    }
  }, [user, isLoading, currentPath, navigate, isPublicRoute]);

  // This component doesn't render anything
  return null;
};

export default AuthGuard;

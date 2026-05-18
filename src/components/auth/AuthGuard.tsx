import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ErrorCategory, logger } from "../../services/logger";
import useAuthStore from "../../stores/authStore";
import { isPublicRoute } from "../../utils/isPublicRoute";

/**
 * Authentication Guard component that redirects unauthenticated users to the login page
 * This component does not render anything itself - it only performs the redirect logic
 */
const AuthGuard = () => {
  const { isLoading, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const onPublicRoute = isPublicRoute(currentPath);

  useEffect(() => {
    // Skip redirection if still loading or on a public route
    if (isLoading || onPublicRoute) {
      return;
    }

    // If user is not authenticated, redirect to login
    if (!user) {
      const to = currentPath.startsWith("/pw") ? "/pw/login" : "/login";
      logger.info(
        ErrorCategory.AUTH,
        "Redirecting unauthenticated user to login",
        {
          action: "authRedirect",
          from: currentPath,
          to,
        }
      );

      void navigate(to, { replace: true });
    }
  }, [user, isLoading, currentPath, navigate, onPublicRoute]);

  // This component doesn't render anything
  return null;
};

export default AuthGuard;

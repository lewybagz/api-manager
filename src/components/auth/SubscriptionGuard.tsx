import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import useUserStore from "../../stores/userStore";
import { userHasAccess } from "../../utils/access";

const SubscriptionGuard = () => {
  const { isLoading, userDoc } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    const bypassEnv = import.meta.env.VITE_PAYWALL_BYPASS_EMAILS as
      | string
      | undefined;
    const bypass = (bypassEnv ? bypassEnv.split(",") : [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const email = userDoc?.email.toLowerCase();
    const isBypassed = email ? bypass.includes(email) : false;
    if (!isBypassed && !userHasAccess(userDoc)) {
      void navigate("/pro", {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [userDoc, isLoading, navigate, location.pathname]);

  return null;
};

export default SubscriptionGuard;

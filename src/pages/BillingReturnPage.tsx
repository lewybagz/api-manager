import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import useUserStore from "../stores/userStore";
import { userHasAccess } from "../utils/access";

export default function BillingReturnPage() {
  const navigate = useNavigate();
  const { userDoc, fetchUserDoc } = useUserStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const uid = userDoc?.uid;
    const attempt = async () => {
      // Poll for up to ~20 seconds
      for (let i = 0; i < 10; i++) {
        if (!mounted) return;
        if (uid) await fetchUserDoc(uid);
        if (userHasAccess(useUserStore.getState().userDoc)) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!mounted) return;
      setChecking(false);
      if (userHasAccess(useUserStore.getState().userDoc)) {
        navigate("/dashboard", { replace: true });
      }
    };
    void attempt();
    return () => {
      mounted = false;
    };
  }, [navigate, userDoc?.uid, fetchUserDoc]);

  const access = userHasAccess(userDoc);

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-4">Payment received</h1>
      {access ? (
        <p className="text-brand-muted">
          Your subscription is active. Redirecting…
        </p>
      ) : (
        <p className="text-brand-muted">
          Activating your subscription… This can take a few seconds. You’ll be
          redirected automatically once ready.
        </p>
      )}
      {!checking && !access && (
        <div className="mt-6 text-sm text-yellow-400">
          We couldn't confirm activation yet. Please refresh this page in a
          moment or contact support.
        </div>
      )}
    </div>
  );
}

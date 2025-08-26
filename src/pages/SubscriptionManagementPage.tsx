import { useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import useUserStore from "../stores/userStore";
async function postCancel(): Promise<Response> {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not authenticated");
  const token = await currentUser.getIdToken();
  return fetch("/api/cancel-subscription", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function parseBypassEmails(): string[] {
  const raw = import.meta.env.VITE_PAYWALL_BYPASS_EMAILS as string | undefined;
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export default function SubscriptionManagementPage() {
  const { userDoc } = useUserStore();
  const email = userDoc?.email?.toLowerCase() ?? "";
  const bypass = useMemo(() => parseBypassEmails(), []);
  const isBypass = email && bypass.includes(email);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Manage Subscription</h1>
      {!userDoc ? (
        <p className="text-brand-muted">Loading account…</p>
      ) : (
        <div className="space-y-6">
          {isBypass ? (
            <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
              <h2 className="text-lg font-semibold mb-2">Dummy Subscription</h2>
              <p className="text-sm text-brand-muted mb-4">
                This is sample data shown because your email is allowlisted in
                VITE_PAYWALL_BYPASS_EMAILS. In production, this page would show
                live subscription details fetched from your account.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-brand-muted">Plan</div>
                  <div className="text-brand-light">Pro — Annual</div>
                </div>
                <div>
                  <div className="text-brand-muted">Status</div>
                  <div className="text-green-400">active</div>
                </div>
                <div>
                  <div className="text-brand-muted">Renews on</div>
                  <div className="text-brand-light">Jan 20, 2026</div>
                </div>
                <div>
                  <div className="text-brand-muted">Price</div>
                  <div className="text-brand-light">$59.88 / year</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="inline-flex items-center justify-center rounded-md border border-brand-border bg-brand-elevated px-4 py-2 text-sm text-brand-light hover:bg-brand-elevated/80">
                  Update payment method
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-60"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setMessage(null);
                    try {
                      const resp = await postCancel();
                      if (!resp.ok) {
                        const t = await resp.json().catch(() => ({}));
                        throw new Error(t.error || "Failed to cancel");
                      }
                      setMessage(
                        "Auto‑renew will end at the current period end."
                      );
                    } catch (e) {
                      setMessage((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Canceling…" : "Cancel auto‑renew"}
                </button>
                <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
                  Download invoice (latest)
                </button>
              </div>
              {message && (
                <div className="mt-3 text-sm text-brand-muted">{message}</div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
              <h2 className="text-lg font-semibold mb-2">Subscription</h2>
              <p className="text-sm text-brand-muted mb-4">
                No subscription data to display in this environment. Ask an
                admin to add your email to VITE_PAYWALL_BYPASS_EMAILS for dummy
                test data or complete checkout to activate your plan.
              </p>
              <a
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
                href="/pro"
              >
                View plans
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

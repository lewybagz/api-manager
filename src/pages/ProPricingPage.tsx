import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

import useUserStore from "../stores/userStore";
import { trialDaysRemaining } from "../utils/access";

const PAYMENT_LINK = "https://buy.stripe.com/eVq7sKcqb6HXaQYdLObbG04";
const TEST_PAYMENT_LINK = "https://buy.stripe.com/3cI28q0Ht3vL1go8rubbG05";

export default function ProPricingPage() {
  const { userDoc } = useUserStore();
  const days = trialDaysRemaining(userDoc);

  const features = [
    "Client‑side AES‑GCM encryption",
    "Organize credentials by projects",
    "Zero‑knowledge: keys never leave your device",
    "7‑day free trial; no card required",
    "Unbypassable subscription verification",
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <section className="mb-10 rounded-xl border border-brand-border bg-gradient-to-b from-brand-dark/40 to-brand-dark-secondary p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-semibold mb-4">
              ZekerKey Pro — Pricing
            </h1>
            <p className="text-brand-muted">
              Subscribe to unlock full access with secure, client‑side encrypted
              credential management. Start with a free 7‑day trial.
            </p>
            {days > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs">
                <Timer className="h-3.5 w-3.5" />
                Trial: {days} day{days === 1 ? "" : "s"} remaining
              </div>
            )}
          </div>
          <div className="w-full md:w-[360px] rounded-lg border border-brand-border bg-brand-elevated p-6 shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-medium flex items-center gap-1">
                  <Sparkles className="h-5 w-5 text-yellow-400" /> Annual
                </div>
                <div className="text-brand-muted">
                  $4.99 / month billed annually
                </div>
              </div>
              <div className="text-4xl font-semibold">$59.88</div>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                "Unlimited projects",
                "Secure by design",
                "Priority improvements",
              ].map((f) => (
                <li className="flex items-center gap-2" key={f}>
                  <CheckCircle2 className="h-4 w-4 text-green-400" /> {f}
                </li>
              ))}
            </ul>
            <a
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-500"
              href={TEST_PAYMENT_LINK}
            >
              Subscribe
            </a>
            <p className="mt-3 text-xs text-brand-muted">
              Use the same email as your ZekerKey login.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
          <div className="flex items-center gap-2 text-brand-light mb-2">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">Free Trial</span>
          </div>
          <p className="text-sm text-brand-muted">
            7‑day app‑managed trial. No card required to start. Subscribe any
            time to keep access after the trial.
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
          <div className="flex items-center gap-2 text-brand-light mb-2">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Zero‑knowledge</span>
          </div>
          <p className="text-sm text-brand-muted">
            AES‑GCM in your browser with a key derived from your master
            password. The key is never persisted.
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
          <div className="flex items-center gap-2 text-brand-light mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Verified Access</span>
          </div>
          <p className="text-sm text-brand-muted">
            Server‑verified subscription via Stripe webhooks ensures an
            unbypassable paywall.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-brand-border bg-brand-elevated p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">What you get</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {features.map((f) => (
            <li className="flex items-center gap-2" key={f}>
              <BadgeCheck className="h-4 w-4 text-green-400" /> {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-brand-border bg-brand-elevated p-6">
        <h2 className="text-lg font-semibold mb-4">How activation works</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-brand-muted">
          <li>
            Click Subscribe and complete checkout with the same email as your
            ZekerKey account.
          </li>
          <li>
            We verify your payment via Stripe webhook events and update your
            account.
          </li>
          <li>
            You’ll be redirected to the return page; access is granted within
            seconds.
          </li>
          <li>Cancel anytime; access continues until period end.</li>
        </ol>
      </section>
    </div>
  );
}

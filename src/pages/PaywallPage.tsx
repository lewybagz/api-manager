import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import useUserStore from "../stores/userStore";
import { trialDaysRemaining } from "../utils/access";

const PAYMENT_LINK = "https://buy.stripe.com/eVq7sKcqb6HXaQYdLObbG04";

export default function PaywallPage() {
  const { userDoc } = useUserStore();
  const days = trialDaysRemaining(userDoc);

  const faqs = [
    {
      a: "Secure, client‑side encrypted credential management with project organization and access anywhere.",
      q: "What do I get with ZekerKey Pro?",
    },
    {
      a: "Your trial starts when your account is created—no payment details required. After 7 days, subscribe to continue uninterrupted access.",
      q: "How does the 7‑day free trial work?",
    },
    {
      a: "No. You only enter payment details when you choose to subscribe.",
      q: "Do I need a card to start?",
    },
    {
      a: "We match your Stripe payment to your ZekerKey account by email. Using the same email ensures your subscription is activated correctly.",
      q: "Why must I use the same email at checkout?",
    },
    {
      a: "You'll be redirected back to ZekerKey and your subscription activates within seconds. If it takes a moment, we'll keep checking automatically.",
      q: "What happens after I pay?",
    },
    {
      a: "Yes. Secrets are encrypted in your browser with AES‑GCM using a key derived from your master password. The key isn’t stored or persisted.",
      q: "Is my data encrypted?",
    },
    {
      a: "Yes. If you cancel, access remains until the end of your current billing period.",
      q: "Can I cancel?",
    },
    {
      a: "$4.99/month billed annually ($59.88 USD per year).",
      q: "How much does it cost?",
    },
  ];

  const [open, setOpen] = useState<null | number>(0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 rounded-xl border border-brand-border bg-gradient-to-b from-brand-dark/40 to-brand-dark-secondary p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <picture>
              <img
                alt="ZekerKey logo"
                className="h-14 w-14 md:h-32 md:w-32 select-none -translate-y-0 md:-translate-y-6"
                sizes="(min-width: 768px) 80px, 56px"
                src="/assets/logos/logo-512x512.png"
                srcSet="/assets/logos/logo-192x192.png 192w, /assets/logos/logo-512x512.png 512w"
              />
            </picture>
            <h1 className="text-3xl md:text-4xl font-semibold mb-5">
              Upgrade to ZekerKey Pro
            </h1>
            <p className="text-brand-muted">
              Unlock full access to secure, client‑side encrypted credential
              management. Your account includes a 7‑day free trial.
            </p>
            <div className="mt-2">
              <Link
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                to="/pro/pricing"
              >
                View full pricing and plan details
              </Link>
            </div>
            {days > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs">
                <Timer className="h-3.5 w-3.5" />
                Trial: {days} day{days === 1 ? "" : "s"} remaining
              </div>
            )}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-brand-light">
                <Lock className="h-4 w-4" /> Client‑side encryption
              </div>
              <div className="flex items-center gap-2 text-brand-light">
                <CreditCard className="h-4 w-4" /> No card required for trial
              </div>
              <div className="flex items-center gap-2 text-brand-light">
                <Shield className="h-4 w-4" /> Unbypassable paywall
              </div>
            </div>
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
                "AES‑GCM encryption in your browser",
                "Priority fixes as the product evolves",
              ].map((f) => (
                <li className="flex items-center gap-2" key={f}>
                  <CheckCircle2 className="h-4 w-4 text-green-400" /> {f}
                </li>
              ))}
            </ul>
            <a
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-500"
              href={PAYMENT_LINK}
            >
              Subscribe
            </a>
            <p className="mt-3 text-xs text-brand-muted">
              Please use the same email as your ZekerKey login.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
          <h2 className="text-lg font-semibold mb-4">What’s included</h2>
          <ul className="space-y-3 text-sm">
            {[
              "Client‑side encryption with a master password",
              "Organize secrets by projects",
              "Fast, modern UI built for developers",
              "7‑day free trial; cancel anytime",
            ].map((f) => (
              <li className="flex items-center gap-2" key={f}>
                <CheckCircle2 className="h-4 w-4 text-green-400" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-elevated p-6">
          <h2 className="text-lg font-semibold mb-4">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-brand-border">
            {faqs.map((item, idx) => {
              const isOpen = open === idx;
              return (
                <button
                  aria-expanded={isOpen}
                  className="w-full py-3 text-left focus:outline-none"
                  key={item.q}
                  onClick={() => {
                    setOpen(isOpen ? null : idx);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-light">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <p className="mt-2 text-sm text-brand-muted">{item.a}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

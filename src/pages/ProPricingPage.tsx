import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingNav from "@/components/marketing/MarketingNav";
import useUserStore from "@/stores/userStore";
import { trialDaysRemaining } from "@/utils/access";

const TEST_PAYMENT_LINK =
  "https://buy.stripe.com/3cI28q0Ht3vL1go8rubbG05";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { amount: 0.15, once: true },
  whileInView: { opacity: 1, y: 0 },
};

const PRICING_FAQ_FULL = [
  {
    a: "No. Encryption runs in your browser before anything is stored. We only persist ciphertext.",
    q: "Does Zeker ever see my passwords or API keys?",
  },
  {
    a: "New vault actions are gated until you subscribe. Your ciphertext remains stored.",
    q: "What happens when my trial ends?",
  },
  {
    a: "Yes. You keep access through the end of your current billing period.",
    q: "Can I cancel anytime?",
  },
  {
    a: "Stripe matches payment to your Zeker account by email. Using the same address prevents mismatches.",
    q: "Why does my email have to match my Zeker login?",
  },
  {
    a: "AES-256-GCM with a key derived on-device via PBKDF2 at 310,000 iterations. Your master password is the root of that key material.",
    q: "What encryption does Zeker use?",
  },
  {
    a: "Projects map cleanly to clients, environments, or products—ideal for freelancers and lean teams.",
    q: "Is this for teams or solo developers?",
  },
  {
    a: "Create an account, set a master password, then create a project and add or import credentials. Global search is available once your vault is unlocked.",
    q: "How do I get started after I subscribe?",
  },
  {
    a: "The headline product is API keys and developer secrets organized by project. A separate password-vault UI exists for personal logins under the same account.",
    q: "Is Zeker only for API keys?",
  },
  {
    a: "Checkout opens in Stripe’s hosted flow. After payment, you return to Zeker and access updates automatically when the webhook confirms your subscription.",
    q: "How does billing work technically?",
  },
  {
    a: "Use the in-app docs from the header, or start on the dashboard and use import + search to validate the workflow end-to-end.",
    q: "Where can I read more?",
  },
];

export default function ProPricingPage() {
  const { userDoc } = useUserStore();
  const days = trialDaysRemaining(userDoc);
  const [openFaq, setOpenFaq] = useState<null | number>(null);

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text antialiased">
      <MarketingNav />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-28 md:pt-32">
        <motion.div {...fadeUp}>
          <p className="font-zk-mono text-xs font-medium tracking-wide text-zk-cyan/90">
            ZekerKey Pro
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
            Full access. One price. No feature tiers.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zk-muted md:text-base">
            Encrypted vault for API keys and developer secrets — organized by
            project, searchable across your workspace, with .env import and file
            attachments.
          </p>
          {days > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-zk-border bg-zk-elevated/60 px-3 py-1.5 font-zk-mono text-xs text-zk-muted">
              <Timer className="h-3.5 w-3.5 text-zk-cyan/80" strokeWidth={1.5} />
              Trial: {days} day{days === 1 ? "" : "s"} left
            </div>
          )}
        </motion.div>

        <motion.div
          className="mt-12 rounded-2xl border border-zk-indigo/40 bg-zk-elevated/50 p-8 shadow-[0_0_48px_-16px_rgba(79,70,229,0.35)]"
          {...fadeUp}
        >
          <p className="font-zk-mono text-xs text-zk-muted">Annual</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-[-0.04em]">
              $4.99
            </span>
            <span className="text-zk-muted">/ month</span>
          </div>
          <p className="mt-1 text-sm text-zk-muted">
            Billed annually at $59.88/year
          </p>
          <ul className="mt-8 space-y-2.5 text-sm">
            {[
              "Unlimited projects",
              "Unlimited credentials",
              "File attachments per project",
              ".env import",
              "Global search",
              "AES-256 client-side encryption",
              "Auto-lock and brute-force protection",
              "In-app documentation",
              "Personal password vault mode",
            ].map((f) => (
              <li className="flex gap-2 text-zk-text/95" key={f}>
                <span className="text-zk-safe">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <a
            className="mt-8 flex w-full items-center justify-center rounded-full bg-zk-indigo py-3.5 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
            href={TEST_PAYMENT_LINK}
            rel="noreferrer"
            target="_blank"
          >
            Subscribe with Stripe
          </a>
          <p className="mt-4 text-center text-xs text-zk-muted">
            Use the same email as your Zeker login.
          </p>
        </motion.div>

        <motion.section className="mt-16" {...fadeUp}>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">
            What you&apos;re paying for
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zk-muted">
            The subscription covers ongoing encryption infrastructure, webhook-driven
            access control, storage for your ciphertext and project files, and
            continuous product work — search, import, and hardening — without
            selling your data. You&apos;re paying for a focused developer tool,
            not an ads business.
          </p>
        </motion.section>

        <motion.section className="mt-16" {...fadeUp}>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">
            Questions
          </h2>
          <div className="mt-6 divide-y divide-zk-border rounded-xl border border-zk-border bg-zk-base/40">
            {PRICING_FAQ_FULL.map((item, i) => (
              <div className="px-3" key={item.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium"
                  onClick={() => {
                    setOpenFaq(openFaq === i ? null : i);
                  }}
                  type="button"
                >
                  {item.q}
                  <span className="font-zk-mono text-zk-muted">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="pb-4 text-sm leading-relaxed text-zk-muted">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className="mt-20 text-center" {...fadeUp}>
          <h2 className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">
            Stop storing secrets in Slack messages and sticky notes.
          </h2>
          <p className="mt-3 text-sm text-zk-muted">
            Encrypted. Organized. Searchable.
          </p>
          <Link
            className="mt-8 inline-flex items-center justify-center rounded-full bg-zk-indigo px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
            to="/login"
          >
            Create your vault — free for 7 days
          </Link>
        </motion.section>
      </main>

      <MarketingFooter />
    </div>
  );
}

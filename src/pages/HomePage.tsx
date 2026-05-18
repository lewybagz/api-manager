import { motion } from "framer-motion";
import {
  Brain,
  ClipboardList,
  Eye,
  Key,
  Lock,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingNav from "@/components/marketing/MarketingNav";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { amount: 0.12, margin: "-48px", once: true },
  whileInView: { opacity: 1, y: 0 },
};

const PRICING_FAQ = [
  {
    a: "No. Encryption runs in your browser before anything is stored. We only persist ciphertext.",
    q: "Does Zeker ever see my passwords or API keys?",
  },
  {
    a: "New vault actions are gated until you subscribe. Your ciphertext stays in place.",
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
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<null | number>(null);

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text antialiased">
      <MarketingNav />

      <section className="relative flex min-h-[100dvh] flex-col justify-center px-4 pb-20 pt-28 md:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(79,70,229,0.18),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="font-zk-mono text-xs font-medium tracking-wide text-zk-cyan/90">
              ZekerKey
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] md:text-5xl lg:text-[3.25rem]">
              The encrypted vault for API keys and developer secrets.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zk-muted md:text-lg">
              Client-side AES-256-GCM encryption. Organized by project.
              Searchable across everything. Your master password never leaves
              your device.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-zk-indigo px-6 py-3 text-sm font-medium text-white shadow-[0_0_28px_-6px_rgba(99,102,241,0.6)] transition-colors hover:bg-zk-indigo-hover"
                to="/login"
              >
                Start free — no card required
              </Link>
              <a
                className="inline-flex items-center justify-center rounded-full border border-zk-border bg-zk-surface/40 px-5 py-2.5 text-sm text-zk-muted transition-colors hover:border-zk-border hover:bg-zk-elevated/60 hover:text-zk-text"
                href="#how-it-works"
              >
                See how it works ↓
              </a>
            </div>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-2xl border border-zk-border bg-gradient-to-br from-zk-elevated/95 via-zk-violet/40 to-zk-base p-1 shadow-[0_24px_80px_-24px_rgba(79,70,229,0.35)]">
              <div className="rounded-[14px] bg-zk-surface/90 p-5 ring-1 ring-white/[0.04]">
                <div className="flex items-center justify-between gap-3 border-b border-zk-border pb-4">
                  <div>
                    <p className="font-zk-sans text-sm font-medium text-zk-text">
                      Payments API
                    </p>
                    <p className="font-zk-mono text-[10px] text-zk-muted">
                      project
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-zk-safe/35 bg-zk-safe/10 px-2.5 py-0.5 font-zk-mono text-[10px] font-medium uppercase tracking-wide text-zk-safe">
                      Active
                    </span>
                    <Lock className="h-4 w-4 text-zk-safe/90" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["backend", "infrastructure"].map((tag) => (
                    <span
                      className="rounded-md border border-zk-border bg-zk-base/60 px-2 py-0.5 font-zk-mono text-[10px] text-zk-muted"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 space-y-3 rounded-lg border border-zk-border bg-zk-base/80 p-4">
                  <div>
                    <p className="font-zk-mono text-[10px] uppercase tracking-wider text-zk-muted">
                      Publishable key
                    </p>
                    <p className="mt-1 font-zk-mono text-sm text-zk-text/90">
                      pk_live_••••••••••••
                    </p>
                  </div>
                  <div>
                    <p className="font-zk-mono text-[10px] uppercase tracking-wider text-zk-muted">
                      Secret key
                    </p>
                    <p className="mt-1 font-zk-mono text-sm text-zk-cyan/80">
                      sk_live_••••••••••••
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-zk-border bg-zk-surface/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-8 md:grid-cols-3 lg:grid-cols-6">
          {[
            { Icon: Lock, label: "AES-256 client-side encryption" },
            { Icon: Brain, label: "Zero-knowledge architecture" },
            { Icon: Key, label: "Master password never transmitted" },
            { Icon: Eye, label: "Secrets masked by default" },
            { Icon: Timer, label: "Auto-locks after inactivity" },
            { Icon: ClipboardList, label: "Clipboard-safe copy flows" },
          ].map(({ Icon, label }) => (
            <div className="flex items-start gap-2.5" key={label}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zk-cyan/85" strokeWidth={1.5} />
              <span className="text-left text-xs font-medium leading-snug text-zk-muted md:text-[13px]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <motion.section
        className="mx-auto max-w-6xl px-4 py-24 md:py-28"
        id="how-it-works"
        {...fadeUp}
      >
        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
          Simple by design. Secure by architecture.
        </h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          {[
            {
              body: "Name it after a client, product, or environment. Set status (Active, Planned, Paused). Every secret lives inside a project — never in a flat pile.",
              step: "01",
              title: "Create a project",
            },
            {
              body: "Type manually, or paste a .env file. Zeker parses KEY=VALUE pairs, separates likely keys from secrets, and lets you assign categories before anything is saved.",
              step: "02",
              title: "Add or import credentials",
            },
            {
              body: "One search bar reaches projects, credentials, and files — decrypted in your session for display. Payloads are encrypted before they leave the browser.",
              step: "03",
              title: "Search across everything",
            },
          ].map((s) => (
            <div
              className="group rounded-xl border border-zk-border bg-zk-elevated/40 p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-20px_rgba(79,70,229,0.25)]"
              key={s.step}
            >
              <p className="font-zk-mono text-xs text-zk-cyan/80">{s.step}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zk-muted">
                {s.body}
              </p>
              <div className="mt-5 h-24 rounded-lg border border-zk-border bg-zk-base/80 p-3 font-zk-mono text-[10px] leading-relaxed text-zk-muted/90">
                {s.step === "01" && (
                  <>
                    <span className="text-zk-cyan/70">$</span> project create
                    <br />
                    <span className="text-zk-muted/50">→</span> status=active
                  </>
                )}
                {s.step === "02" && (
                  <>
                    STRIPE_SECRET_KEY=…
                    <br />
                    <span className="text-zk-safe/80">parsed</span> · 12 vars
                  </>
                )}
                {s.step === "03" && (
                  <>
                    <span className="text-zk-cyan/70">/</span> search “stripe
                    prod”
                    <br />
                    <span className="text-zk-muted/50">3 matches · 1 project</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="border-y border-zk-border bg-zk-surface/25 py-24 md:py-28"
        {...fadeUp}
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
            Your secrets are encrypted before they ever leave your browser.
          </h2>
          <div className="mt-12 overflow-hidden rounded-xl border border-zk-border bg-zk-base shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 border-b border-zk-border bg-zk-elevated/50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zk-muted/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-zk-muted/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-zk-muted/25" />
              <span className="ml-3 font-zk-mono text-[10px] text-zk-muted">
                encryption_flow
              </span>
            </div>
            <pre className="overflow-x-auto p-6 font-zk-mono text-[11px] leading-[1.85] text-zk-muted md:text-xs">
              <span className="text-zk-cyan/90">Your device</span>
              {"\n"}
              {"  "}↓ master password → key derived locally (PBKDF2, 310k
              iterations)
              {"\n"}
              {"  "}↓ payload encrypted with AES-256-GCM
              {"\n"}
              {"  "}↓ only ciphertext reaches the server
              {"\n"}
              {"  "}↓ server stores an encrypted blob it cannot read
              {"\n\n"}
              <span className="text-zk-text">Zeker never sees your plaintext.</span>
            </pre>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                t: "Master password stays local",
                d: "Key derivation happens on your device. We never receive your master password.",
              },
              {
                t: "Masked until you act",
                d: "Fields stay hidden by default. Reveal or copy on demand.",
              },
              {
                t: "Auto-lock built in",
                d: "Idle for 30 minutes locks the vault. Tab hidden 5+ minutes? Locks on return.",
              },
              {
                t: "Brute-force protection",
                d: "Five failed unlock attempts trigger a lockout.",
              },
            ].map((c) => (
              <div
                className="rounded-lg border border-zk-border bg-zk-elevated/30 p-4"
                key={c.t}
              >
                <p className="text-sm font-medium text-zk-text">{c.t}</p>
                <p className="mt-2 text-xs leading-relaxed text-zk-muted">
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="mx-auto max-w-6xl px-4 py-24 md:py-28" {...fadeUp}>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
          Everything a developer&apos;s credential workflow actually needs.
        </h2>
        <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-6 md:gap-3">
          <div className="rounded-xl border border-zk-border bg-zk-elevated/35 p-6 transition-transform duration-300 hover:-translate-y-0.5 md:col-span-4">
            <h3 className="text-base font-semibold">Project workspaces</h3>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              Projects as the unit of organization. Status badges, credential
              density, and per-project files — one workspace per client,
              environment, or product.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 font-zk-mono text-[10px] text-zk-muted">
              <div className="rounded border border-zk-border bg-zk-base/60 p-2">
                acme-web · 14 keys
              </div>
              <div className="rounded border border-zk-border bg-zk-base/60 p-2">
                billing-svc · 6 keys
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zk-border bg-zk-elevated/35 p-6 transition-transform duration-300 hover:-translate-y-0.5 md:col-span-2">
            <h3 className="text-base font-semibold">.env import</h3>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              Paste an env file. Smart parsing, key vs secret heuristics,
              categories, then file into a project.
            </p>
          </div>
          <div className="rounded-xl border border-zk-border bg-zk-elevated/35 p-6 transition-transform duration-300 hover:-translate-y-0.5 md:col-span-3">
            <h3 className="text-base font-semibold">Global search</h3>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              Command-palette style. Project names, credential names, notes, and
              key material — one keystroke across the vault.
            </p>
            <p className="mt-4 rounded border border-zk-border bg-zk-base/70 px-3 py-2 font-zk-mono text-[10px] text-zk-cyan/80">
              ⌘K · search vault…
            </p>
          </div>
          <div className="rounded-xl border border-zk-border bg-zk-elevated/35 p-6 transition-transform duration-300 hover:-translate-y-0.5 md:col-span-3">
            <h3 className="text-base font-semibold">Credential categories</h3>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              Frontend, backend, database, DevOps, mobile, analytics — filter
              inside a project without losing context.
            </p>
          </div>
          <div className="rounded-xl border border-zk-border bg-zk-elevated/35 p-6 transition-transform duration-300 hover:-translate-y-0.5 md:col-span-2">
            <h3 className="text-base font-semibold">File attachments</h3>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              Config exports, runbooks, and artifacts live next to the keys they
              belong with.
            </p>
          </div>
          <div className="rounded-xl border border-zk-border bg-zk-elevated/35 p-6 transition-transform duration-300 hover:-translate-y-0.5 md:col-span-4">
            <h3 className="text-base font-semibold">Clipboard-safe copying</h3>
            <p className="mt-2 text-sm leading-relaxed text-zk-muted">
              One-click copy with timed feedback — avoid leaving secrets visible
              on screen longer than necessary.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="border-y border-zk-border bg-zk-surface/20 py-24 md:py-28"
        {...fadeUp}
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
            Fast. Keyboard-driven. No friction.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zk-muted md:text-base">
            Built for the way developers actually work — dense UI, clear hierarchy,
            no toy animations.
          </p>
          <ul className="mt-10 grid gap-3 font-zk-mono text-xs text-zk-muted md:grid-cols-2 md:text-[13px]">
            {[
              "Global search across every project",
              "Category filters for large vaults",
              "Copy to clipboard without exposing values",
              ".env import — skip retyping forty variables",
              "Project status: live vs deprecated at a glance",
              "In-app docs — onboarding without a new tab",
            ].map((line) => (
              <li
                className="flex items-start gap-3 rounded-lg border border-zk-border bg-zk-base/50 px-4 py-3"
                key={line}
              >
                <span className="mt-0.5 text-zk-cyan/70">▹</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      <motion.section className="mx-auto max-w-3xl px-4 py-16 md:py-20" {...fadeUp}>
        <h2 className="text-lg font-medium text-zk-muted">
          Also: a personal password vault
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zk-muted/90">
          Zeker includes a separate password manager mode for personal logins,
          organized with tags. Same encryption model, different UI — included
          under the same account. Not the headline; just there when you need it.
        </p>
      </motion.section>

      <motion.section
        className="border-t border-zk-border bg-zk-violet/20 py-24 md:py-28"
        id="pricing"
        {...fadeUp}
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
            One plan. Everything included.
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="font-zk-mono text-xs uppercase tracking-wider text-zk-cyan/80">
                Trial
              </p>
              <h3 className="mt-2 text-xl font-semibold">7-day free trial</h3>
              <p className="mt-3 text-sm leading-relaxed text-zk-muted">
                No credit card required. Full access from day one so you can run
                a real workflow before you pay.
              </p>
            </div>
            <div className="rounded-2xl border border-zk-indigo/40 bg-zk-elevated/50 p-8 shadow-[0_0_40px_-12px_rgba(79,70,229,0.35)]">
              <p className="font-zk-mono text-xs text-zk-muted">Pro</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.04em]">
                  $4.99
                </span>
                <span className="text-zk-muted">/ month</span>
              </div>
              <p className="mt-1 text-sm text-zk-muted">
                Billed annually at $59.88/yr
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-zk-text/95">
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
                  <li className="flex gap-2" key={f}>
                    <span className="text-zk-safe">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-zk-indigo px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
                  to="/login"
                >
                  Start 7-day free trial
                </Link>
                <Link
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-zk-border px-5 py-3 text-center text-sm text-zk-muted transition-colors hover:bg-zk-base/60 hover:text-zk-text"
                  to="/pro/pricing"
                >
                  Subscribe with Stripe
                </Link>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zk-muted">
                No card to start. Cancel anytime. Access continues through the
                end of your billing period.
              </p>
            </div>
          </div>

          <div className="mt-16 divide-y divide-zk-border rounded-xl border border-zk-border bg-zk-base/40">
            {PRICING_FAQ.map((item, i) => (
              <div className="px-4 py-1" key={item.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-zk-text"
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
        </div>
      </motion.section>

      <section className="border-t border-zk-border bg-transparent py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
            Stop storing secrets in Slack threads and sticky notes.
          </h2>
          <p className="mt-4 text-sm text-zk-muted md:text-base">
            Encrypted. Organized. Searchable. Ready in about a minute.
          </p>
          <Link
            className="mt-8 inline-flex items-center justify-center rounded-full bg-zk-indigo px-8 py-3.5 text-sm font-medium text-white shadow-[0_0_32px_-8px_rgba(99,102,241,0.55)] transition-colors hover:bg-zk-indigo-hover"
            to="/login"
          >
            Create your vault — free for 7 days
          </Link>
          <p className="mt-4 text-xs text-zk-muted">
            No credit card. No setup fee. Cancel anytime.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

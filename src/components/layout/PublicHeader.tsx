import { LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import useUserStore from "@/stores/userStore";
import { userHasAccessOrBypass } from "@/utils/access";

export default function PublicHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const pricingActive = pathname.startsWith("/pro/pricing");
  const proActive =
    pathname === "/pro" || (pathname.startsWith("/pro/") && !pricingActive);
  const docsActive = pathname === "/docs" || pathname.startsWith("/docs/");
  const baseItem =
    "relative rounded-lg px-3 py-1.5 font-zk-sans text-sm transition-colors";
  const inactive =
    "text-zk-muted hover:bg-zk-elevated/40 hover:text-zk-text";
  const active =
    "border border-zk-border bg-zk-elevated/70 text-zk-text";

  const userDoc = useUserStore((state) => state.userDoc);
  const hasAccess = userHasAccessOrBypass(userDoc);

  return (
    <header className="sticky top-0 z-30 border-b border-zk-border bg-zk-surface/35 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-zk-surface/25">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link className="inline-flex items-center gap-2" to="/">
          <img
            alt="ZekerKey"
            className="h-12 w-12"
            src="/assets/logos/logo-192x192.png"
          />
          <span className="font-zk-sans text-base font-semibold tracking-[-0.03em] text-zk-text">
            ZekerKey
          </span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-lg bg-transparent sm:flex">
          <Link
            className={`${baseItem} ${proActive ? active : inactive}`}
            to="/pro"
          >
            Pro
            {proActive && (
              <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-zk-indigo/90" />
            )}
          </Link>
          <Link
            className={`${baseItem} ${pricingActive ? active : inactive}`}
            to="/pro/pricing"
          >
            Pricing
            {pricingActive && (
              <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-zk-indigo/90" />
            )}
          </Link>
          <Link
            className={`${baseItem} ${docsActive ? active : inactive}`}
            to="/docs"
          >
            Docs
            {docsActive && (
              <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-zk-indigo/90" />
            )}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-zk-indigo px-3 py-2 font-zk-sans text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
            to={hasAccess ? "/dashboard" : "/pro"}
          >
            <LogIn className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {hasAccess ? "Dashboard" : "Pro"}
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-zk-border bg-zk-base/60 px-3 py-2 font-zk-sans text-sm font-medium text-zk-text transition-colors hover:border-zk-indigo/35 hover:bg-zk-indigo/10"
            to="/login"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

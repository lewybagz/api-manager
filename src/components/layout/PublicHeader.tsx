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
  const baseItem = "relative px-3 py-1.5 rounded-md transition-colors";
  const inactive =
    "text-brand-muted hover:text-brand-light hover:bg-brand-elevated/30";
  const active =
    "text-brand-light bg-brand-elevated/60 border border-brand-border";

  const userDoc = useUserStore((state) => state.userDoc);
  const hasAccess = userHasAccessOrBypass(userDoc);

  return (
    <header className="border-b border-brand-border bg-brand-dark/70 backdrop-blur supports-[backdrop-filter]:bg-brand-dark/50 sticky top-0 z-30 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link className="inline-flex items-center gap-2" to="/">
          <img
            alt="ZekerKey"
            className="h-12 w-12"
            src="/assets/logos/logo-192x192.png"
          />
          <span className="font-semibold tracking-tight text-brand-light">
            ZekerKey
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-1 text-sm bg-transparent rounded-md">
          <Link
            className={`${baseItem} ${proActive ? active : inactive}`}
            to="/pro"
          >
            Pro
            {proActive && (
              <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-blue-500/80" />
            )}
          </Link>
          <Link
            className={`${baseItem} ${pricingActive ? active : inactive}`}
            to="/pro/pricing"
          >
            Pricing
            {pricingActive && (
              <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-blue-500/80" />
            )}
          </Link>
          <Link
            className={`${baseItem} ${docsActive ? active : inactive}`}
            to="/docs"
          >
            Docs
            {docsActive && (
              <span className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-0.5 rounded-full bg-blue-500/80" />
            )}
          </Link>
          {/* link back to */}
        </nav>
        <div className="flex items-center gap-2">
          {/* link back to dashboard */}
          <Link
            className="flex items-center p-2 text-sm rounded-md bg-brand-blue text-white hover:bg-brand-blue/80"
            to={hasAccess ? "/dashboard" : "/pro"}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {hasAccess ? "Back to Dashboard" : "Back to Pro"}
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
            to="/login"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

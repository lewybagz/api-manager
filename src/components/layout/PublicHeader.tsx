import { Link, useLocation } from "react-router-dom";

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
        </nav>
        <div className="flex items-center gap-2">
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

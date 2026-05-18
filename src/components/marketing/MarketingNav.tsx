import { Link } from "react-router-dom";

import useAuthStore from "@/stores/authStore";
import useUserStore from "@/stores/userStore";
import { userHasAccessOrBypass } from "@/utils/access";

export default function MarketingNav() {
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserStore((s) => s.userDoc);
  const hasAccess = userHasAccessOrBypass(userDoc);

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-zk-border bg-zk-surface/40 px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <Link className="group flex flex-col leading-tight" to="/">
          <span className="font-zk-sans text-base font-semibold tracking-[-0.04em] text-zk-text">
            Zeker
          </span>
          <span className="font-zk-sans text-[10px] font-medium uppercase tracking-[0.14em] text-zk-muted">
            by Tovuti
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            className="font-zk-sans rounded-full px-3 py-1.5 text-sm text-zk-muted transition-colors hover:bg-zk-elevated/80 hover:text-zk-text"
            to="/docs"
          >
            Docs
          </Link>
          <Link
            className="font-zk-sans rounded-full px-3 py-1.5 text-sm text-zk-muted transition-colors hover:bg-zk-elevated/80 hover:text-zk-text"
            to="/pro/pricing"
          >
            Pricing
          </Link>
          <Link
            className="font-zk-sans rounded-full px-3 py-1.5 text-sm text-zk-muted transition-colors hover:bg-zk-elevated/80 hover:text-zk-text"
            to="/login"
          >
            Sign in
          </Link>
          <Link
            className="font-zk-sans ml-1 rounded-full bg-zk-indigo px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.55)] transition-colors hover:bg-zk-indigo-hover"
            to={user ? (hasAccess ? "/dashboard" : "/pro") : "/login"}
          >
            {user ? (hasAccess ? "Dashboard" : "Continue") : "Start free"}
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link
            className="font-zk-sans rounded-full px-2.5 py-1.5 text-xs text-zk-muted hover:bg-zk-elevated/80 hover:text-zk-text"
            to="/docs"
          >
            Docs
          </Link>
          <Link
            className="font-zk-sans rounded-full px-2.5 py-1.5 text-xs text-zk-muted hover:bg-zk-elevated/80 hover:text-zk-text"
            to="/pro/pricing"
          >
            Pricing
          </Link>
          <Link
            className="font-zk-sans rounded-full bg-zk-indigo px-3 py-1.5 text-xs font-medium text-white"
            to={user ? (hasAccess ? "/dashboard" : "/pro") : "/login"}
          >
            {user ? "Open" : "Start"}
          </Link>
        </div>
      </div>
    </header>
  );
}

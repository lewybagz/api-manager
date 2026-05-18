import { Link } from "react-router-dom";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zk-border bg-transparent">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="font-zk-sans text-lg font-semibold tracking-[-0.03em] text-zk-text">
            Zeker
          </div>
          <p className="mt-1 font-zk-sans text-[10px] font-medium uppercase tracking-[0.14em] text-zk-muted">
            Powered by Tovuti
          </p>
          <p className="mt-4 font-zk-sans text-sm leading-relaxed text-zk-muted">
            Encrypted vault for API keys and developer secrets. Organized by
            project, searchable across your workspace, encrypted before upload.
          </p>
          <p className="mt-4 font-zk-mono text-xs text-zk-muted/80">
            Also: personal password vault at{" "}
            <Link className="text-zk-cyan/90 hover:text-zk-cyan" to="/pw">
              /pw
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-3 font-zk-sans text-sm text-zk-muted">
          <Link className="hover:text-zk-text" to="/docs">
            Docs
          </Link>
          <Link className="hover:text-zk-text" to="/pro/pricing">
            Pricing
          </Link>
          <Link className="hover:text-zk-text" to="/login">
            Sign in
          </Link>
          <span className="text-zk-border">|</span>
          <span className="cursor-default text-zk-muted/70" title="Add your URLs">
            Privacy
          </span>
          <span className="cursor-default text-zk-muted/70" title="Add your URLs">
            Terms
          </span>
        </div>
      </div>
    </footer>
  );
}

import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import useUserStore from "../../stores/userStore";
import { userHasAccessOrBypass } from "../../utils/access";

interface DocCardProps {
  description: string;
  locked?: boolean;
  slug: string;
  title: string;
}

export default function DocCard({
  description,
  locked,
  slug,
  title,
}: DocCardProps) {
  const { isLoading, userDoc } = useUserStore();
  const canAccess = !locked || (!isLoading && userHasAccessOrBypass(userDoc));
  return (
    <article className="flex flex-col rounded-xl border border-zk-border bg-zk-elevated/40 p-5 transition-colors hover:border-zk-indigo/25 hover:bg-zk-elevated/55">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-[-0.02em] text-zk-text">
          {title}
        </h2>
        {locked && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/35 bg-amber-950/25 px-2 py-0.5 font-zk-mono text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
            <Lock className="h-3 w-3" strokeWidth={1.5} /> Pro
          </span>
        )}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zk-muted">
        {description}
      </p>
      <div className="mt-4">
        <Link
          className="inline-flex items-center justify-center rounded-lg border border-zk-border bg-zk-base/60 px-3 py-2 text-sm font-medium text-zk-text transition-colors hover:border-zk-indigo/30 hover:bg-zk-indigo/15 hover:text-zk-indigo"
          to={canAccess ? `/docs/${slug}` : "/pro"}
        >
          {canAccess ? "Read article" : "View plans"}
        </Link>
      </div>
    </article>
  );
}

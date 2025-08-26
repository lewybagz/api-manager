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
    <article className="rounded-lg border border-brand-border bg-brand-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-medium text-brand-light">{title}</h2>
        {locked && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-yellow-400 border border-yellow-400/40 rounded px-1.5 py-0.5">
            <Lock className="h-3 w-3" /> Pro
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-brand-muted">{description}</p>
      <div className="mt-4">
        <Link
          className="inline-flex items-center justify-center rounded-md border border-brand-border bg-brand-dark-secondary px-3 py-1.5 text-sm text-brand-light hover:bg-brand-elevated/70"
          to={canAccess ? `/docs/${slug}` : "/pro"}
        >
          {canAccess ? "Read doc" : "Subscribe to read"}
        </Link>
      </div>
    </article>
  );
}

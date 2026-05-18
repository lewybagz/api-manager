import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import RoutePageFallback from "../components/layout/RoutePageFallback";
import { getDocBySlug } from "../docs/registry";
import useUserStore from "../stores/userStore";
import { userHasAccessOrBypass } from "../utils/access";

const DocMarkdownArticle = lazy(
  () => import("../components/docs/DocMarkdownArticle")
);

export default function DocDetailPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { isLoading, userDoc } = useUserStore();

  const meta = useMemo(() => getDocBySlug(slug), [slug]);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!meta) return;
    meta
      .load()
      .then((md) => {
        setContent(md);
      })
      .catch(() => {
        setContent("# Not found");
      });
  }, [meta]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h1 className="mb-4 text-xl font-semibold tracking-[-0.02em]">
            Article not found
          </h1>
          <Link
            className="text-sm font-medium text-zk-indigo transition-colors hover:text-zk-indigo-hover"
            to="/docs"
          >
            ← Back to documentation
          </Link>
        </main>
      </div>
    );
  }

  if (meta.locked && !isLoading && !userHasAccessOrBypass(userDoc)) {
    return <Navigate replace state={{ from: `/docs/${slug}` }} to="/pro" />;
  }

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {meta.title}
          </h1>
          {meta.locked && (
            <div className="mt-2 font-zk-mono text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
              Included with your plan
            </div>
          )}
        </div>

        <Suspense fallback={<RoutePageFallback />}>
          <DocMarkdownArticle content={content} />
        </Suspense>
        <footer className="mt-10 border-t border-zk-border pt-6 text-xs text-zk-muted">
          Last updated: {new Date().toLocaleDateString()}
        </footer>
      </main>
    </div>
  );
}

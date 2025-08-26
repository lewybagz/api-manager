import { useMemo } from "react";

import DocCard from "../components/docs/DocCard";
import { DOCS_REGISTRY } from "../docs/registry";

export default function DocsPage() {
  const items = useMemo(() => DOCS_REGISTRY, []);

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      <main className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold mb-6">Documentation</h1>
        <p className="text-sm text-brand-muted mb-8">
          Browse our documentation. Some docs require an active subscription to
          read fully.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((doc) => (
            <DocCard
              description={doc.description}
              key={doc.slug}
              locked={doc.locked}
              slug={doc.slug}
              title={doc.title}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

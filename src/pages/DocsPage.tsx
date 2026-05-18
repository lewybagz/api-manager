import { useMemo } from "react";

import DocCard from "../components/docs/DocCard";
import { DOCS_REGISTRY } from "../docs/registry";

export default function DocsPage() {
  const items = useMemo(() => DOCS_REGISTRY, []);

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="mb-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          Documentation
        </h1>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-zk-muted sm:text-base">
          Browse product guides. Some articles need an active plan to read in
          full.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
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

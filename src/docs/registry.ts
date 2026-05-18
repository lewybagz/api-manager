export interface DocMeta {
  description: string;
  load: () => Promise<string>;
  locked?: boolean;
  slug: string;
  title: string;
}

// Foundation registry. Expand as we add customer-facing docs.
export const DOCS_REGISTRY: DocMeta[] = [
  {
    description: "Start using ZekerKey in minutes.",
    load: async () => (await import("../../docs/public/getting-started.md?raw")).default,
    locked: false,
    slug: "getting-started",
    title: "Getting Started",
  },
  {
    description: "How ZekerKey protects your data.",
    load: async () => (await import("../../docs/public/security-overview.md?raw")).default,
    locked: false,
    slug: "security-overview",
    title: "Security Overview",
  },
  {
    description: "Understand trials, Pro access, and billing.",
    load: async () => (await import("../../docs/public/stripe-paywall-overview.md?raw")).default,
    locked: false,
    slug: "pro-access",
    title: "Pro Access & Billing",
  },
  {
    description: "Stripe paywall integration plan and architecture.",
    load: async () => (await import("../../docs/billing/stripe-paywall.md?raw")).default,
    locked: true,
    slug: "stripe-paywall",
    title: "Stripe Paywall (Technical)",
  },
];

export function getDocBySlug(slug: string): DocMeta | undefined {
  return DOCS_REGISTRY.find((d) => d.slug === slug);
}



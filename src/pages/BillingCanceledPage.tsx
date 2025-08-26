import { Link } from "react-router-dom";

export default function BillingCanceledPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-4">Checkout canceled</h1>
      <p className="text-brand-muted mb-6">
        Your checkout was canceled. You can resume anytime.
      </p>
      <Link
        to="/pro"
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        Return to plans
      </Link>
    </div>
  );
}

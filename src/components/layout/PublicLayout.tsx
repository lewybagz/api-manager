import { Outlet } from "react-router-dom";

import PublicHeader from "./PublicHeader";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

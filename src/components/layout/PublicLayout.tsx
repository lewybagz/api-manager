import { Outlet } from "react-router-dom";

import PublicHeader from "./PublicHeader";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { PwToastProvider } from "./PwToastProvider";
import SidebarNav from "./SidebarNav";

const LayoutShell: React.FC = () => {
  const [sidebarOpen] = useState(true);

  useEffect(() => {
    document.body.classList.add("pw-theme");
    return () => {
      document.body.classList.remove("pw-theme");
    };
  }, []);

  return (
    <PwToastProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-pw-bg-3 to-pw-bg-1 text-[color:var(--pw-text)]">
        <Header />
        <div className="mx-auto max-w-9xl px-3 sm:px-6 grid grid-cols-12 gap-4 pt-4">
          <aside
            className={`col-span-12 md:col-span-3 lg:col-span-2 transition-all ${
              sidebarOpen ? "opacity-100" : "opacity-0 md:opacity-100 md:w-auto"
            }`}
          >
            <SidebarNav />
          </aside>
          <main className="col-span-12 md:col-span-9 lg:col-span-10 pb-10">
            <Outlet />
          </main>
        </div>
      </div>
    </PwToastProvider>
  );
};

export default LayoutShell;

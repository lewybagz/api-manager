"use client";

import type React from "react";

import { Menu } from "lucide-react";

import EncryptionStatusIndicator from "../auth/EncryptionStatusIndicator";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuOpen }) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zk-border bg-zk-surface/95 p-4 backdrop-blur-xl sm:px-6 md:hidden lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <img
          alt="ZekerKey"
          className="h-9 w-9 shrink-0 rounded-lg opacity-95"
          src="/assets/logos/logo-sidebar-40x40.png"
        />
        <div className="flex min-w-0 flex-col">
          <span className="font-zk-sans text-lg font-semibold tracking-[-0.03em] text-zk-text">
            Zeker
          </span>
          <span className="font-zk-sans text-[10px] font-medium uppercase tracking-[0.12em] text-zk-muted">
            Powered by Tovuti
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="rounded-lg border border-zk-border bg-zk-base/50 p-0.5">
          <EncryptionStatusIndicator />
        </div>
        <button
          aria-label="Open navigation menu"
          className="rounded-xl p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
          onClick={onMenuOpen}
          type="button"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;

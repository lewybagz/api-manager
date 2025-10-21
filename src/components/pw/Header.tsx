import React, { useEffect, useRef, useState } from "react";
import { Search, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearEncryptionKey } = useAuthStore();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [q, setQ] = useState<string>("");

  // Sync local value with URL (?q=)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("q") ?? "";
    setQ(next);
  }, [location.search]);

  // Global shortcuts: Ctrl+F / Ctrl+K focuses the search from anywhere
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isFind = (e.ctrlKey || e.metaKey) && (key === "f" || key === "k");
      if (!isFind) return;
      e.preventDefault();
      e.stopPropagation();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, {
        capture: true,
      } as any);
  }, []);

  const applySearch = (value: string) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set("q", value);
    else params.delete("q");
    const nextSearch = params.toString();
    // Always navigate to the main PW list view for searching
    navigate({ pathname: "/pw", search: nextSearch ? `?${nextSearch}` : "" });
  };
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-[color:var(--pw-bg-0)]/70 border-b border-[color:var(--pw-border)] py-2">
      <div className="mx-auto max-w-9xl px-3 sm:px-6 h-14 flex items-center gap-2">
        <img
          src="/assets/logos/logo-512x512-accent.png"
          alt="Zeker Passwords - Actually Useful, Actually Secure"
          className="h-16 w-16"
        />
        <h1 className="font-semibold tracking-wide text-brand-light text-lg">
          Zeker Passwords - Actually{" "}
          <strong className="text-pw-accent-1 font-bold">Useful</strong>,
          Actually{" "}
          <strong className="text-pw-accent-1 font-bold">Secure</strong>
        </h1>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-8 w-[560px]">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[color:var(--pw-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="pw-search"
              ref={inputRef}
              className="pw-input w-full pl-9"
              placeholder="Search passwords (Ctrl+F / Ctrl+K)"
              value={q}
              onChange={(e) => {
                const value = e.target.value;
                setQ(value);
                applySearch(value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch(q);
                if (e.key === "Escape") {
                  setQ("");
                  applySearch("");
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
          <button
            className="pw-btn-ghost text-pw-accent-1"
            type="button"
            onClick={async () => {
              clearEncryptionKey();
              await signOut(auth);
              navigate("/login");
            }}
            aria-label="Logout "
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

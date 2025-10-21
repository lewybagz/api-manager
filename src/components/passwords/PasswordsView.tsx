import { useEffect, useMemo, useState } from "react";
import PasswordModal from "./PasswordModal";

import usePasswordStore from "../../stores/passwordStore";
import { toast } from "sonner";

export default function PasswordsView() {
  const {
    fetchPasswords,
    isLoading,
    passwords,
    softDeletePassword,
    restorePassword,
  } = usePasswordStore();
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<null | {
    id: string;
    name: string;
    username?: string;
    url?: string;
    notes?: string;
    password: string;
  }>(null);

  useEffect(() => {
    void fetchPasswords();
  }, [fetchPasswords]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const el = document.getElementById("pw-search");
        if (el) (el as HTMLInputElement).focus();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "v"
      ) {
        e.preventDefault();
        setShow((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return passwords;
    return passwords.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.url?.toLowerCase().includes(q)
    );
  }, [passwords, query]);

  if (isLoading) {
    return <p className="text-red-300">Loading passwords…</p>;
  }

  if (!passwords.length) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-8 text-center">
        <p className="text-red-300/80">No passwords yet. Add your first one.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <input
          id="pw-search"
          className="flex-1 rounded-lg bg-black/60 border border-red-900/40 px-3 py-2 text-red-100 placeholder-red-300/50"
          placeholder="Search by name, username, or URL (Ctrl+F)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded-lg border border-red-900/40 text-red-200"
          onClick={() => setShow((s) => !s)}
          type="button"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {filtered.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-red-900/40 bg-red-950/30 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-red-200 font-medium truncate">{p.name}</p>
              {p.username ? (
                <p className="text-red-300/70 text-sm truncate">{p.username}</p>
              ) : null}
              {p.url ? (
                <a
                  className="text-red-400 text-xs underline break-all"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.url}
                </a>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                className="rounded-md bg-black/60 border border-red-900/40 px-2 py-1 text-red-100 w-40 sm:w-64"
                type={show ? "text" : "password"}
                value={p.password}
              />
              <button
                className="text-black bg-red-500 hover:bg-red-400 rounded-lg px-3 py-1 text-sm font-semibold"
                onClick={() => {
                  void navigator.clipboard.writeText(p.password);
                }}
                type="button"
              >
                Copy
              </button>
              <button
                className="px-3 py-1 rounded-lg border border-red-900/40 text-red-200"
                onClick={() => setEditing(p)}
                type="button"
              >
                Edit
              </button>
              <button
                className="px-3 py-1 rounded-lg border border-red-900/40 text-red-200"
                onClick={async () => {
                  await softDeletePassword(p.id);
                  toast("Password moved to trash", {
                    action: {
                      label: "Undo",
                      onClick: () => {
                        void restorePassword(p.id);
                      },
                    },
                  });
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      {editing ? (
        <PasswordModal initial={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

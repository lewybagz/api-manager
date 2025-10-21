import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import usePasswordStore from "../stores/passwordStore";
import PwConfirmDialog from "../components/pw/PwConfirmDialog";

export default function TrashPage() {
  const { fetchTrashed, hardDeletePassword, restorePassword, trashCount } =
    usePasswordStore();
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      username?: string;
      url?: string;
      deletedAt?: any;
    }>
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      await fetchTrashed();
      const user = auth.currentUser;
      if (!user) {
        setItems([]);
        return;
      }
      try {
        const q = query(
          collection(db, "users", user.uid, "passwords"),
          where("isDeleted", "==", true),
          limit(5)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name as string,
            username: data.username as string | undefined,
            url: data.url as string | undefined,
            deletedAt: data.deletedAt,
          };
        });
        setItems(list);
      } catch {
        setItems([]);
      }
    };
    void load();
  }, [fetchTrashed, trashCount]);

  const none = items.length === 0;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (none) return;
      if (e.key === "Delete") {
        e.preventDefault();
        if (selected.length > 0) setConfirm(true);
      }
      if (e.key === "Enter") {
        if (selected.length === 1) void restorePassword(selected[0]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [none, selected, restorePassword]);
  // const allSelected = selected.length > 0 && selected.length === items.length;

  return (
    <div className="grid gap-4">
      <div className="pw-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-red-200">Trash</h1>
            <p className="text-[color:var(--pw-muted)] text-sm">
              Last 5 deleted passwords are kept here.
            </p>
          </div>
          {selected.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                className="pw-btn-ghost"
                type="button"
                onClick={() => setSelected([])}
              >
                Clear Selection
              </button>
              <button
                className="pw-btn-ghost"
                type="button"
                onClick={() => {
                  for (const id of selected) void restorePassword(id);
                  setSelected([]);
                }}
              >
                Restore Selected
              </button>
              <button
                className="pw-btn-primary"
                type="button"
                onClick={() => setConfirm(true)}
              >
                Delete Forever
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {none ? (
        <div className="pw-card p-8 text-center">
          <p className="text-[color:var(--pw-muted)]">
            Nothing in Trash. Deleted items appear here for quick restore.{" "}
            <br /> No you CAN NOT put your teammates here...
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-[color:var(--pw-border)] bg-[color:var(--pw-bg-1)]"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(it.id)}
                  onChange={() =>
                    setSelected((s) =>
                      s.includes(it.id)
                        ? s.filter((x) => x !== it.id)
                        : [...s, it.id]
                    )
                  }
                />
                <div>
                  <p className="text-[color:var(--pw-text)] font-medium">
                    {it.name}
                  </p>
                  <div className="text-xs text-[color:var(--pw-muted)] flex gap-3">
                    {it.username ? <span>{it.username}</span> : null}
                    {it.url ? (
                      <a
                        href={it.url}
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {it.url}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="pw-btn-ghost"
                  type="button"
                  onClick={() => void restorePassword(it.id)}
                >
                  Restore
                </button>
                <button
                  className="pw-btn-primary"
                  type="button"
                  onClick={() => {
                    setSelected([it.id]);
                    setConfirm(true);
                  }}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PwConfirmDialog
        open={confirm}
        title={`Permanently delete ${selected.length} item${
          selected.length === 1 ? "" : "s"
        }?`}
        description="This cannot be undone. Shit's not a game."
        confirmText="Delete forever"
        cancelText="Cancel"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          for (const id of selected) await hardDeletePassword(id);
          setSelected([]);
        }}
      />
    </div>
  );
}

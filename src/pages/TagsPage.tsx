import { useEffect, useMemo, useState } from "react";
import useTagStore from "../stores/tagStore";
import { useNavigate } from "react-router-dom";
import TagChip from "../components/pw/TagChip";
import { Pencil, Save, Trash, X } from "lucide-react";

interface ColorPopoverProps {
  current: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (color: string) => void;
}

function ColorPopover({ current, onChange }: ColorPopoverProps) {
  const [hex, setHex] = useState(current);

  // Keep local field in sync when external value changes
  useEffect(() => {
    setHex(current);
  }, [current]);

  const normalizeHex = (value: string): string | null => {
    let v = value.trim().toLowerCase();
    if (!v) return null;
    if (v[0] !== "#") v = `#${v}`;
    // Allow 3 or 6 hex digits
    const short = /^#([0-9a-f]{3})$/i;
    const long = /^#([0-9a-f]{6})$/i;
    if (long.test(v)) return v;
    const m = short.exec(v);
    if (m) {
      const s = m[1];
      return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
    }
    return null;
  };

  // Debounce propagate to parent to avoid rapid loops during dragging
  useEffect(() => {
    const normalized = normalizeHex(hex);
    if (!normalized || normalized === current) return;
    const t = setTimeout(() => {
      onChange(normalized);
    }, 120);
    return () => clearTimeout(t);
  }, [hex, current, onChange]);

  return (
    <div className="flex items-center gap-2 bg-[color:var(--pw-bg-2)] border border-[color:var(--pw-border)] rounded-lg px-2 py-1 w-fit">
      <input
        aria-label="Pick color"
        className="appearance-none w-8 h-8 rounded-md p-0 cursor-pointer"
        type="color"
        value={current}
        onChange={(e) => {
          setHex(e.target.value);
        }}
      />
      <input
        aria-label="Hex color"
        className="pw-input w-28"
        value={hex}
        onChange={(e) => {
          setHex(e.target.value);
        }}
        placeholder="#RRGGBB"
        maxLength={7}
      />
    </div>
  );
}

export default function TagsPage() {
  const navigate = useNavigate();
  const { tags, fetchTags, renameTag, recolorTag, deleteTag, mergeTags } =
    useTagStore();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "usage" | "updated">("name");
  const [selected, setSelected] = useState<string[]>([]);
  const [mergeTarget, setMergeTarget] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#ef4444");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#ef4444");

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = tags;
    if (q) filtered = tags.filter((t) => t.normalizedName.includes(q));
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name")
        return a.normalizedName.localeCompare(b.normalizedName);
      if (sortKey === "usage") return (b.usageCount ?? 0) - (a.usageCount ?? 0);
      return (
        (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)
      );
    });
    return sorted;
  }, [tags, query, sortKey]);

  const onToggleSelect = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  return (
    <div className="grid gap-4">
      <div className="pw-card p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h1 className="text-2xl font-semibold text-red-200">
            Tags - Tagging is for pros
          </h1>
          <div className="flex items-center gap-2">
            <input
              className="pw-input"
              placeholder="Search tags"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="pw-input"
              value={sortKey}
              onChange={(e) =>
                setSortKey(e.target.value as "name" | "usage" | "updated")
              }
            >
              <option value="name">Name</option>
              <option value="usage">Most used</option>
              <option value="updated">Recently updated</option>
            </select>
          </div>
        </div>

        <div className="pw-card p-4 flex items-center gap-2">
          <input
            className="pw-input flex-1"
            placeholder="Create a tag"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <ColorPopover current={newColor} onChange={setNewColor} />
          <button
            className="pw-btn-primary"
            onClick={async () => {
              const name = newName.trim();
              if (!name) return;
              await useTagStore.getState().createTag(name, newColor);
              setNewName("");
            }}
            type="button"
          >
            Add Tag
          </button>
        </div>
      </div>

      {tags.length < 3 ? (
        <div className="pw-card p-4">
          <p className="text-sm text-[color:var(--pw-muted)]">
            New to tags? Try these:
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              {
                name: "Gaming",
                color: "#a855f7",
                hint: "(Steam, PSN, Epic, Battle.net, Riot, Xbox, etc.)",
              },
              {
                name: "Dev/Cloud",
                color: "#06b6d4",
                hint: "(GitHub, AWS, GCP, CI/CD stuff)",
              },
              {
                name: "Email & Social",
                color: "#3b82f6",
                hint: "(Gmail, Outlook, Discord, Slack)",
              },
              {
                name: "Security / 2FA",
                color: "#ef4444",
                hint: "(Accounts that need codes or keys)",
              },
              {
                name: "Admin / Servers",
                color: "#22c55e",
                hint: "(Routers, panels, VPS, dashboards)",
              },
            ].map((ex) => (
              <span key={ex.name} className="inline-flex items-center gap-1">
                <TagChip
                  label={ex.name}
                  color={ex.color}
                  onClick={() => {
                    setNewName(ex.name);
                    setNewColor(ex.color);
                  }}
                />
                <span className="text-[11px] text-[color:var(--pw-muted)]">
                  {ex.hint}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="pw-card p-3 flex items-center justify-between">
          <span className="text-sm text-[color:var(--pw-muted)]">
            {selected.length} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              className="pw-input"
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
            >
              <option value="">Merge into…</option>
              {tags
                .filter((t) => !selected.includes(t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <button
              className="pw-btn-primary"
              disabled={!mergeTarget}
              onClick={async () => {
                for (const id of selected) {
                  if (id !== mergeTarget) await mergeTags(id, mergeTarget);
                }
                setSelected([]);
                setMergeTarget("");
              }}
              type="button"
            >
              Merge
            </button>
            <button
              className="pw-btn-ghost"
              onClick={async () => {
                for (const id of selected) await deleteTag(id);
                setSelected([]);
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-3">
        {list.map((t) => (
          <div
            key={t.id}
            className={`pw-card p-4 max-w-2xl ${
              selected.includes(t.id) ? "ring-1 ring-red-500/40" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <button
                  className="text-left"
                  onClick={() => navigate(`/pw?tags=${t.id}`)}
                  type="button"
                >
                  <TagChip label={t.name} color={t.color} />
                </button>
                <p className="text-xs text-[color:var(--pw-muted)] mt-1">
                  {(t.usageCount ?? 0).toLocaleString()} items
                </p>
              </div>
              <input
                aria-label="Select tag"
                type="checkbox"
                checked={selected.includes(t.id)}
                onChange={() => onToggleSelect(t.id)}
                className="w-4 h-4 -translate-y-3"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="pw-btn-ghost"
                onClick={() => {
                  setEditingId(t.id);
                  setEditingName(t.name);
                  setEditingColor(t.color);
                }}
                type="button"
              >
                <Pencil className="h-5 w-5" color={t.color} />
              </button>
              <button
                className="pw-btn-ghost ml-auto"
                onClick={() => void deleteTag(t.id)}
                type="button"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!list.length ? (
        <div className="pw-card p-8 text-center text-[color:var(--pw-muted)] grid gap-3">
          <p>No tags yet. Create your first tag:</p>
          <div className="flex flex-col items-center gap-3 justify-center">
            <input
              className="pw-input w-64"
              placeholder="Tag name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <ColorPopover current={newColor} onChange={setNewColor} />
            <button
              className="pw-btn-primary"
              onClick={async () => {
                const name = newName.trim();
                if (!name) return;
                await useTagStore.getState().createTag(name, newColor);
                setNewName("");
              }}
              type="button"
            >
              Add Tag
            </button>
          </div>
        </div>
      ) : null}

      {editingId ? (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setEditingId(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-[color:var(--pw-border)] bg-[color:var(--pw-bg-1)] p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-red-200">Edit Tag</h3>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="text-xs text-[color:var(--pw-muted)]">
                    Name
                  </label>
                  <input
                    className="pw-input w-full"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[color:var(--pw-muted)]">
                    Color
                  </label>
                  <ColorPopover
                    current={editingColor}
                    onChange={setEditingColor}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    className="pw-btn-ghost"
                    onClick={() => setEditingId(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="pw-btn-primary"
                    onClick={async () => {
                      const id = editingId;
                      const name = editingName.trim();
                      const color = editingColor;
                      if (id) {
                        if (name) await renameTag(id, name);
                        await recolorTag(id, color);
                      }
                      setEditingId(null);
                    }}
                    type="button"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

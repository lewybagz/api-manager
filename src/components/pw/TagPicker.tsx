import { useEffect, useMemo, useState } from "react";
import useTagStore from "../../stores/tagStore";
import TagChip from "./TagChip";

interface TagPickerProps {
  value: string[];
  // eslint-disable-next-line no-unused-vars
  onChange: (next: string[]) => void;
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export default function TagPicker({ value, onChange }: TagPickerProps) {
  const { tags, fetchTags, createTag } = useTagStore();
  const [query, setQuery] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.normalizedName.includes(q));
  }, [tags, query]);

  return (
    <div className="grid gap-2">
      {value.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[color:var(--pw-muted)] mr-1">
            Selected:
          </span>
          {value
            .map((id) => tags.find((t) => t.id === id))
            .filter(Boolean)
            .map((t) => (
              <TagChip
                key={(t as any).id}
                label={(t as any).name}
                color={(t as any).color}
                selected
                onRemove={() =>
                  onChange(value.filter((x) => x !== (t as any).id))
                }
              />
            ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          className="pw-input flex-1"
          placeholder="Search or create tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="pw-input"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Color"
        >
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          className="pw-btn-primary"
          onClick={async () => {
            const name = query.trim();
            if (!name) return;
            const id = await createTag(name, color);
            if (id && !value.includes(id)) {
              if (value.length >= 20) return;
              onChange([...value, id]);
            }
            setQuery("");
          }}
          type="button"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.map((t) => (
          <TagChip
            key={t.id}
            label={t.name}
            color={t.color}
            selected={value.includes(t.id)}
            onClick={() => {
              if (value.includes(t.id)) {
                onChange(value.filter((x) => x !== t.id));
              } else if (value.length < 20) {
                onChange([...value, t.id]);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

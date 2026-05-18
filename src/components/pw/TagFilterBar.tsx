import { useEffect } from "react";
import useTagStore from "../../stores/tagStore";
import TagChip from "./TagChip";

interface TagFilterBarProps {
  activeTagIds: string[];
  onChange: (ids: string[]) => void;
  filterMode: "or" | "and";
  onModeChange: (mode: "or" | "and") => void;
}

export default function TagFilterBar({
  activeTagIds,
  onChange,
  filterMode,
  onModeChange,
}: TagFilterBarProps) {
  const { tags, fetchTags } = useTagStore();
  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const toggle = (id: string) => {
    if (activeTagIds.includes(id))
      onChange(activeTagIds.filter((x) => x !== id));
    else {
      if (filterMode === "and" && activeTagIds.length >= 5) return;
      onChange([...activeTagIds, id]);
    }
  };

  if (!tags.length) return null;

  return (
    <div className="pw-card p-3 flex items-center gap-2 flex-wrap w-fit">
      <span className="text-sm text-[color:var(--pw-muted)] mr-2">
        Filter by tag:
      </span>
      <div className="flex items-center gap-2 mr-2">
        <button
          className={`pw-btn-ghost ${
            filterMode === "or" ? "bg-[color:var(--pw-card)]" : ""
          }`}
          onClick={() => onModeChange("or")}
          type="button"
          aria-label="OR mode"
        >
          OR
        </button>
        <button
          className={`pw-btn-ghost ${
            filterMode === "and" ? "bg-[color:var(--pw-card)]" : ""
          }`}
          onClick={() => onModeChange("and")}
          type="button"
          aria-label="AND mode (max 5)"
        >
          AND
        </button>
      </div>
      {tags.map((t) => (
        <TagChip
          key={t.id}
          label={t.name}
          color={t.color}
          selected={activeTagIds.includes(t.id)}
          onClick={() => toggle(t.id)}
        />
      ))}
      {activeTagIds.length ? (
        <button
          className="pw-btn-ghost ml-auto"
          onClick={() => onChange([])}
          type="button"
        >
          Clear
        </button>
      ) : null}
      {filterMode === "and" && activeTagIds.length >= 5 ? (
        <span className="text-xs text-[color:var(--pw-muted)] ml-2">
          Max 5 tags in AND mode
        </span>
      ) : null}
    </div>
  );
}

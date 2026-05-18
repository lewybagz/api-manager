import React from "react";
import {
  List,
  Grid2X2,
  SortAsc,
  SortDesc,
  Trash2,
  CheckSquare,
  XSquare,
} from "lucide-react";

export type SortKey = "name" | "createdAt" | "updatedAt";
export type ViewMode = "list" | "grid";

interface PasswordToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSortKeyChange: (k: SortKey) => void;
  onSortDirToggle: () => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

const PasswordToolbar: React.FC<PasswordToolbarProps> = ({
  query,
  onQueryChange,
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirToggle,
  viewMode,
  onViewModeChange,
  selectedCount,
  onClearSelection,
  onBulkDelete,
}) => {
  return (
    <div className="pw-card p-3 mb-3 flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="flex-1 flex items-center gap-2">
        <input
          id="pw-search"
          className="pw-input w-full"
          placeholder="Search passwords"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <select
            className="pw-input px-2 py-2"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
          >
            <option value="name">Name</option>
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
          </select>
          <button
            className="pw-btn-ghost"
            onClick={onSortDirToggle}
            type="button"
            aria-label="Toggle sort direction"
          >
            {sortDir === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`pw-btn-ghost ${
            viewMode === "list" ? "bg-[color:var(--pw-card)]" : ""
          }`}
          onClick={() => onViewModeChange("list")}
          type="button"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          className={`pw-btn-ghost ${
            viewMode === "grid" ? "bg-[color:var(--pw-card)]" : ""
          }`}
          onClick={() => onViewModeChange("grid")}
          type="button"
        >
          <Grid2X2 className="h-4 w-4" />
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[color:var(--pw-muted)] hidden sm:inline-flex items-center gap-1">
            <CheckSquare className="h-4 w-4" /> {selectedCount} selected
          </span>
          <button
            className="pw-btn-ghost"
            onClick={onClearSelection}
            type="button"
            aria-label="Clear selection"
          >
            <XSquare className="h-4 w-4" />
          </button>
          <button
            className="pw-btn-primary"
            onClick={onBulkDelete}
            type="button"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default PasswordToolbar;

import { useEffect, useMemo, useState } from "react";
import { usePwToasts } from "./PwToastProvider";
import PwConfirmDialog from "./PwConfirmDialog";
import usePasswordStore from "../../stores/passwordStore";
import PasswordRow from "./PasswordRow";
import PasswordCard from "./PasswordCard";
import PasswordDrawer from "./PasswordDrawer";
import type { SortKey, ViewMode } from "./PasswordToolbar";
import { logger, ErrorCategory } from "../../services/logger";

export default function PasswordList({
  query,
  sortKey,
  sortDir,
  viewMode,
  activeTagIds,
  filterMode,
}: {
  query: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  viewMode: ViewMode;
  activeTagIds?: string[];
  filterMode?: "or" | "and";
}) {
  const { passwords, fetchPasswords } = usePasswordStore();
  const pwToasts = usePwToasts();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [masked, setMasked] = useState(true);
  const [drawerId, setDrawerId] = useState<null | string>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = passwords;
    if (activeTagIds && activeTagIds.length > 0) {
      list = list.filter((p) => {
        const tags = Array.isArray(p.tagIds) ? p.tagIds : [];
        if (filterMode === "and") {
          // AND mode: include if all active tags are present (bounded by UI to 5)
          return activeTagIds.every((t) => tags.includes(t));
        }
        // OR mode
        return activeTagIds.some((t) => tags.includes(t));
      });
    }
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.username?.toLowerCase().includes(q) ||
          p.url?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "createdAt")
        return (a.createdAt.toMillis() - b.createdAt.toMillis()) * dir;
      return (a.updatedAt.toMillis() - b.updatedAt.toMillis()) * dir;
    });
    return list;
  }, [passwords, query, sortKey, sortDir, activeTagIds, filterMode]);

  useEffect(() => {
    void fetchPasswords();
  }, [fetchPasswords]);

  useEffect(() => {
    const sample = items.slice(0, 5).map((p) => ({
      id: p.id,
      nameLength: p.name?.length ?? 0,
      hasUsername: Boolean(p.username),
      hasUrl: Boolean(p.url),
    }));
    logger.info(ErrorCategory.CREDENTIAL, "PasswordList render", {
      storeCount: passwords.length,
      visibleCount: items.length,
      viewMode,
      queryPresent: Boolean(query.trim()),
    });
    logger.debug(ErrorCategory.CREDENTIAL, "PasswordList sample", {
      sampleCount: sample.length,
      itemsSample: sample,
    });
    if (items.length === 0) {
      logger.warn(ErrorCategory.CREDENTIAL, "PasswordList empty", {
        storeCount: passwords.length,
        queryPresent: Boolean(query.trim()),
      });
    }
  }, [passwords, items, viewMode, query]);

  const onToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runBulkDelete = async () => {
    const initialSelection = [...selectedIds];
    const toastId = pwToasts.show({
      type: "loading",
      title: "Deleting selected passwords…",
    });
    const { softDeletePassword, restorePassword } = usePasswordStore.getState();
    const succeeded: string[] = [];
    let failed = 0;
    for (const id of initialSelection) {
      try {
        await softDeletePassword(id);
        succeeded.push(id);
      } catch {
        failed++;
      }
    }
    setSelectedIds([]);
    if (succeeded.length > 0) {
      pwToasts.update(toastId, {
        type: failed === 0 ? "success" : "warning",
        title:
          failed === 0
            ? "Moved to Trash"
            : `Moved ${succeeded.length} to Trash, ${failed} failed`,
        actionLabel: "Undo",
        onAction: async () => {
          for (const id of succeeded) {
            try {
              await restorePassword(id);
            } catch {
              // ignore
            }
          }
        },
        duration: 5000,
      });
    } else {
      pwToasts.update(toastId, {
        type: "error",
        title: "Failed to delete selected items",
      });
    }
  };

  const bulkDelete = () => {
    if (!selectedIds.length) return;
    setConfirmOpen(true);
  };

  if (!items.length) {
    return (
      <div className="pw-card p-8 text-center">
        <p className="text-[color:var(--pw-muted)]">
          No passwords found. Use the Add button to create your first entry.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="grid gap-2">
        {selectedIds.length > 0 ? (
          <div className="pw-card p-3 flex items-center justify-between">
            <span className="text-sm text-[color:var(--pw-muted)]">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="pw-btn-ghost"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="pw-btn-primary"
                onClick={bulkDelete}
              >
                Delete selected
              </button>
            </div>
          </div>
        ) : null}
        <PwConfirmDialog
          open={confirmOpen}
          title={`Delete ${selectedIds.length} selected password${
            selectedIds.length > 1 ? "s" : ""
          }?`}
          description="You can restore them later from Trash but are you sure my boy??"
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void runBulkDelete();
          }}
        />
        {items.map((p) => (
          <PasswordRow
            key={p.id}
            id={p.id}
            name={p.name}
            username={p.username}
            url={p.url}
            masked={masked}
            password={p.password}
            notes={p.notes}
            createdAt={p.createdAt}
            updatedAt={p.updatedAt}
            tagIds={p.tagIds}
            selected={selectedIds.includes(p.id)}
            onToggleSelect={onToggleSelect}
            onToggleMask={() => setMasked((m) => !m)}
            onEdit={(id) => setDrawerId(id)}
          />
        ))}
        {drawerId ? (
          <PasswordDrawer id={drawerId} onClose={() => setDrawerId(null)} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {selectedIds.length > 0 ? (
        <div className="pw-card p-3 flex items-center justify-between">
          <span className="text-sm text-[color:var(--pw-muted)]">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="pw-btn-ghost"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
            <button
              type="button"
              className="pw-btn-primary"
              onClick={bulkDelete}
            >
              Delete selected
            </button>
          </div>
        </div>
      ) : null}
      <PwConfirmDialog
        open={confirmOpen}
        title={`Delete ${selectedIds.length} selected password${
          selectedIds.length > 1 ? "s" : ""
        }?`}
        description="You can restore them later from Trash but are you sure my boy??"
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void runBulkDelete();
        }}
      />
      {items.map((p) => (
        <PasswordCard
          key={p.id}
          id={p.id}
          name={p.name}
          username={p.username}
          url={p.url}
          password={p.password}
          notes={p.notes}
          createdAt={p.createdAt}
          updatedAt={p.updatedAt}
          lastAccessedAt={p.lastAccessedAt}
          tagIds={p.tagIds}
          onCopy={() => {
            void navigator.clipboard.writeText(p.password);
          }}
          onEdit={() => setDrawerId(p.id)}
        />
      ))}
      {drawerId ? (
        <PasswordDrawer id={drawerId} onClose={() => setDrawerId(null)} />
      ) : null}
    </div>
  );
}

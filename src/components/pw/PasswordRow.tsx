import React, { useMemo, useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Pencil, Lock, Trash2, Info } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import useTagStore from "../../stores/tagStore";
import TagChip from "./TagChip";
import TagPicker from "./TagPicker";
import PwConfirmDialog from "./PwConfirmDialog";
import { usePwToasts } from "./PwToastProvider";
import { copyAndAutoClear } from "@/utils/clipboard";

interface PasswordRowProps {
  id: string; // consumed by handlers
  name: string;
  username?: string;
  url?: string;
  masked: boolean;
  password: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tagIds?: string[];
  selected: boolean;
  // eslint-disable-next-line no-unused-vars
  onToggleSelect: (id: string) => void;
  onToggleMask: () => void;
  // eslint-disable-next-line no-unused-vars
  onEdit: (id: string) => void;
}

const PasswordRow: React.FC<PasswordRowProps> = ({
  id,
  name,
  username,
  url,
  masked,
  password,
  notes,
  createdAt,
  tagIds,
  selected,
  onToggleSelect,
  onToggleMask,
  onEdit,
}) => {
  const createdAtText = useMemo(
    () => createdAt?.toDate?.().toLocaleString?.() ?? "",
    [createdAt]
  );
  const notesData = useMemo(() => {
    if (!notes) return { preview: "", full: "", truncated: false };
    const lines = notes.split("\n");
    const kept: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // Stop including anything below backup codes block to avoid giant tooltips
      if (/^Backup Codes:\s*$/.test(line)) break;
      kept.push(line);
      i++;
    }
    const full = kept.join(" ").replace(/\s+/g, " ").trim();
    const truncated = full.length > 120;
    const preview = truncated ? full.slice(0, 120) + "…" : full;
    return { preview, full, truncated };
  }, [notes]);
  const { tags } = useTagStore();
  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((t) => [t.id, t])),
    [tags]
  );
  const [showPicker, setShowPicker] = useState(false);
  const pwToasts = usePwToasts();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement as HTMLElement).tagName === "INPUT"
      )
        return;
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setShowPicker((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div
      className={`flex flex-wrap max-w-3xl items-start justify-between gap-3 px-3 py-2 rounded-lg border border-pw-border bg-pw-bg-1 ${
        selected ? "bg-pw-bg-2" : "hover:bg-pw-bg-3"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <input
          aria-label="Select row"
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(id)}
        />
        <div className="min-w-0">
          <p className="truncate text-pw-text font-medium">{name}</p>
          <div className="flex items-center gap-2 text-xs text-pw-muted">
            {username ? <span className="truncate">{username}</span> : null}
            {url ? (
              <a
                className="underline truncate"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {url}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <input
          readOnly
          className="rounded-lg bg-pw-bg-2 border border-pw-border px-3 py-2 text-pw-text placeholder-pw-muted focus:outline-none focus:ring-2 focus:ring-red-500/40 w-40 sm:w-64 max-w-full"
          type={masked ? "password" : "text"}
          value={password}
        />
        <button
          className="inline-flex items-center justify-center rounded-lg border border-pw-border text-pw-text px-3 py-2 hover:bg-pw-bg-2 transition-colors"
          onClick={() => {
            void copyAndAutoClear(password, 15000);
            pwToasts.show({
              type: "success",
              title: "Copied",
              description: "Password copied. Auto-clearing clipboard in 15s.",
              duration: 2000,
            });
          }}
          type="button"
          aria-label="Copy"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-pw-border text-pw-text px-3 py-2 hover:bg-pw-bg-2 transition-colors"
          onClick={onToggleMask}
          type="button"
          aria-label="Mask/unmask"
        >
          {masked ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>

        <button
          className="inline-flex items-center justify-center rounded-lg border border-pw-border text-pw-text px-3 py-2 hover:bg-pw-bg-2 transition-colors"
          onClick={() => onEdit(id)}
          type="button"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-pw-border text-pw-text px-3 py-2 hover:bg-pw-bg-2 transition-colors"
          onClick={() => setConfirmOpen(true)}
          type="button"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <PwConfirmDialog
        open={confirmOpen}
        title="Delete this password?"
        description="You can restore it later from Trash."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          const { softDeletePassword, restorePassword } = (
            await import("../../stores/passwordStore")
          ).default.getState();
          try {
            await softDeletePassword(id);
            pwToasts.show({
              type: "success",
              title: "Moved to Trash",
              actionLabel: "Undo",
              onAction: () => {
                void restorePassword(id);
              },
              duration: 5000,
            });
          } catch {
            // ignore
          }
        }}
      />

      {notesData.preview ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="block max-w-[80ch] truncate">
            Notes: {notesData.preview}
          </span>
          {notesData.truncated ? (
            <div className="relative flex items-center group/notes">
              <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-pre-wrap break-words shadow-2xl opacity-0 group-hover/notes:opacity-100 transition-opacity duration-300 pointer-events-none z-[9999]">
                {notes}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1 text-[11px] text-pw-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-pw-bg-2 px-2 py-0.5 text-[10px] text-red-200">
          <Lock className="h-3 w-3" /> Encrypted
        </span>
        {createdAtText ? <span>Created: {createdAtText}</span> : null}
      </div>
      <div className="flex flex-wrap gap-1 mt-1 items-center">
        {Array.isArray(tagIds) && tagIds.length
          ? tagIds.map((tid) => {
              const t = (tagMap as any)[tid];
              return t ? (
                <TagChip key={tid} label={t.name} color={t.color} />
              ) : null;
            })
          : null}
        <button
          className="pw-btn-ghost text-xs px-2 py-1"
          onClick={() => setShowPicker((s) => !s)}
          type="button"
        >
          + Tag
        </button>
      </div>
      {showPicker ? (
        <div className="mt-2 p-2 rounded-lg border border-pw-border bg-pw-bg-2">
          <TagPicker
            value={Array.isArray(tagIds) ? tagIds : []}
            onChange={(next) => {
              setShowPicker(false);
              pwToasts.show({
                type: "success",
                title: "Tag added",
                duration: 2000,
              });
              import("../../stores/passwordStore").then(
                ({ default: usePasswordStore }) => {
                  const { updatePassword } = usePasswordStore.getState();
                  void updatePassword(id, { tagIds: next as any });
                }
              );
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              className="pw-btn-ghost text-xs"
              onClick={() => setShowPicker(false)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PasswordRow;

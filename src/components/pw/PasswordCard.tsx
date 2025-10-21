import { useMemo, useState } from "react";
import { Copy, Pencil, Eye, EyeOff, Lock, Trash2 } from "lucide-react";
import TagChip from "./TagChip";
import useTagStore from "../../stores/tagStore";
import TagPicker from "./TagPicker";
import { usePwToasts } from "./PwToastProvider";
import PwConfirmDialog from "./PwConfirmDialog";
import type { Timestamp } from "firebase/firestore";

interface PasswordCardProps {
  id: string;
  name: string;
  username?: string;
  url?: string;
  password: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastAccessedAt?: Timestamp;
  tagIds?: string[];
  onCopy: () => void;
  onEdit: () => void;
}

export default function PasswordCard({
  id,
  name,
  username,
  url,
  password,
  notes,
  createdAt,
  lastAccessedAt,
  onCopy,
  onEdit,
  tagIds,
}: PasswordCardProps) {
  const [masked, setMasked] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pwToasts = usePwToasts();
  const createdAtText = useMemo(
    () => createdAt?.toDate?.().toLocaleString?.() ?? "",
    [createdAt]
  );
  const lastAccessedText = useMemo(
    () => lastAccessedAt?.toDate?.().toLocaleString?.() ?? "",
    [lastAccessedAt]
  );
  const parsed = useMemo(() => {
    const raw = notes ?? "";
    const lines = raw.split("\n");
    const kept: string[] = [];
    let platform: string = "";
    let gamerTag: string = "";
    let region: string = "";
    let twoFA: string = "";
    let backupCodes: string = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const m = /^(Platform|GamerTag|Region|2FA):\s*(.*)$/.exec(line);
      if (m) {
        const key = m[1];
        const value = m[2] ?? "";
        if (key === "Platform") platform = value;
        else if (key === "GamerTag") gamerTag = value;
        else if (key === "Region") region = value;
        else if (key === "2FA") twoFA = value;
        i++;
        continue;
      }
      if (/^Backup Codes:\s*$/.test(line)) {
        i++;
        const codes: string[] = [];
        while (i < lines.length && lines[i].trim().length > 0) {
          codes.push(lines[i]);
          i++;
        }
        backupCodes = codes.join("\n");
        continue;
      }
      kept.push(line);
      i++;
    }
    const baseNotes = kept.join("\n").trim();
    return { baseNotes, platform, gamerTag, region, twoFA, backupCodes };
  }, [notes]);
  const notesPreview = useMemo(() => {
    if (!parsed.baseNotes) return "";
    const text = parsed.baseNotes.replace(/\s+/g, " ").trim();
    return text.length > 140 ? text.slice(0, 140) + "…" : text;
  }, [parsed.baseNotes]);
  return (
    <div className="pw-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[color:var(--pw-text)] font-medium truncate">
            {name}
          </p>
          {username ? (
            <p className="text-[color:var(--pw-muted)] text-sm truncate">
              {username}
            </p>
          ) : null}
          {url ? (
            <a
              className="text-red-400 text-xs underline break-all"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {url}
            </a>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              className="pw-input w-48 sm:w-64"
              type={masked ? "password" : "text"}
              value={password}
            />
            <button
              className="pw-btn-ghost"
              onClick={onCopy}
              type="button"
              aria-label="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              className="pw-btn-ghost"
              onClick={() => setMasked((m) => !m)}
              type="button"
              aria-label="Mask/unmask"
            >
              {masked ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--pw-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--pw-bg-2)] px-2 py-0.5 text-[10px] text-red-200">
              <Lock className="h-3 w-3" /> Encrypted
            </span>
            {createdAtText ? <span>Created: {createdAtText}</span> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <TagChips tagIds={tagIds} />
            <button
              className="pw-btn-ghost text-xs px-2 py-1"
              onClick={() => setShowPicker((s) => !s)}
              type="button"
            >
              + Tag
            </button>
          </div>
          {showPicker ? (
            <div className="mt-2 p-2 rounded-lg border border-[color:var(--pw-border)] bg-[color:var(--pw-bg-2)]">
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
                      void updatePassword(id, {
                        tagIds: next as any,
                      });
                    }
                  );
                }}
              />
            </div>
          ) : null}
          {parsed.platform ||
          parsed.gamerTag ||
          parsed.region ||
          parsed.twoFA ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
              {parsed.platform ? (
                <div>
                  <span className="text-[color:var(--pw-muted)]">
                    Platform:
                  </span>{" "}
                  {parsed.platform}
                </div>
              ) : null}
              {parsed.gamerTag ? (
                <div>
                  <span className="text-[color:var(--pw-muted)]">
                    Gamer Tag:
                  </span>{" "}
                  {parsed.gamerTag}
                </div>
              ) : null}
              {parsed.region ? (
                <div>
                  <span className="text-[color:var(--pw-muted)]">Region:</span>{" "}
                  {parsed.region}
                </div>
              ) : null}
              {parsed.twoFA ? (
                <div>
                  <span className="text-[color:var(--pw-muted)]">2FA:</span>{" "}
                  {parsed.twoFA}
                </div>
              ) : null}
            </div>
          ) : null}
          {parsed.baseNotes || parsed.backupCodes || lastAccessedText ? (
            <div className="mt-3">
              {notesPreview ? (
                <div className="text-sm text-[color:var(--pw-text)]">
                  <span className="text-[color:var(--pw-muted)] mr-1">
                    Notes:
                  </span>
                  {notesPreview}
                </div>
              ) : null}
              <div className="mt-2 space-y-3">
                {parsed.backupCodes ? (
                  <div>
                    <p className="text-[color:var(--pw-muted)] text-xs mb-1">
                      Backup Codes
                    </p>
                    <pre className="text-xs bg-pw-bg-2 py-2 px-4 rounded-md overflow-auto max-h-40 w-fit">
                      {parsed.backupCodes}
                    </pre>
                  </div>
                ) : null}
                {lastAccessedText ? (
                  <div className="text-[color:var(--pw-muted)] text-[11px]">
                    Last accessed: {lastAccessedText}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="pw-btn-ghost"
            onClick={onEdit}
            type="button"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="pw-btn-ghost"
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
          description="You can restore it later from Trash but are you sure my boy??"
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
      </div>
    </div>
  );
}

function TagChips({ tagIds }: { tagIds?: string[] }) {
  const { tags } = useTagStore();
  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((t) => [t.id, t])),
    [tags]
  );
  if (!Array.isArray(tagIds) || tagIds.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tagIds.map((id) => {
        const t = (tagMap as any)[id];
        return t ? <TagChip key={id} label={t.name} color={t.color} /> : null;
      })}
    </div>
  );
}

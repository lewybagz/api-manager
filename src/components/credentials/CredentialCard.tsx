import { type Timestamp } from "firebase/firestore";
import {
  BookLock,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Info,
  MoreVertical,
  RefreshCw,
  SquarePen,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

import { type DecryptedCredential } from "../../stores/credentialStore";

export interface CredentialCardProps {
  anyCredentialHasNote?: boolean;
  className?: string; // Optional, for custom styling
  clipboardTimeoutApiKey: boolean;
  clipboardTimeoutApiSecret: boolean;
  credential: DecryptedCredential;
  credentialHasNote?: boolean;
  credentialHasSecret?: boolean;
  isApiKeyCopied: boolean;
  isApiKeyRevealed: boolean;
  isApiSecretCopied: boolean;
  isApiSecretRevealed: boolean;
  isServiceNameCopied: boolean;
  maskCredential: (value: string, revealed: boolean) => string;
  onChangeCategory?: (newCategory: string) => void;
  onCopyApiKey: () => void;
  onCopyApiSecret: () => void;
  onCopyServiceName: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleApiKeyReveal: () => void;
  onToggleApiSecretReveal: () => void;
  onToggleSelect?: () => void;
  onUpdateNeeded?: () => void; // Optional, only if credential needs update
  selected?: boolean;
}

const formatTimestamp = (ts: null | Timestamp): string => {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleDateString();
  } catch {
    return String(ts);
  }
};

const CredentialCard: React.FC<CredentialCardProps> = ({
  className,
  clipboardTimeoutApiKey,
  clipboardTimeoutApiSecret,
  credential,
  isApiKeyCopied,
  isApiKeyRevealed,
  isApiSecretCopied,
  isApiSecretRevealed,
  isServiceNameCopied,
  maskCredential,
  onCopyApiKey,
  onCopyApiSecret,
  onCopyServiceName,
  onDelete,
  onEdit,
  onToggleApiKeyReveal,
  onToggleApiSecretReveal,
  onToggleSelect,
  onUpdateNeeded,
  selected = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = menuWrapRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const hasSecret = credential.apiSecret && credential.apiSecret.length > 0;
  const category = (credential.category ?? "none").toLowerCase();
  const needsUpdate =
    credential.apiKey === "PLACEHOLDER-RESET-VALUE" && Boolean(onUpdateNeeded);

  return (
    <div
      className={cn(
        "group relative w-full overflow-visible border-0 border-b border-zk-border bg-zk-elevated/35 backdrop-blur-sm transition-colors duration-200 last:border-b-0 hover:bg-zk-indigo/50",
        menuOpen && "z-[80]",
        selected && "bg-zk-indigo/15 ring-1 ring-inset ring-zk-indigo/30",
        className,
      )}
    >
      <div className="flex flex-col items-start justify-between gap-0 p-2 px-4 md:flex-row md:items-center">
        {/* Service Info */}
        <div className="flex min-w-0 items-center gap-3">
          {onToggleSelect ? (
            <input
              aria-label={`Select ${credential.serviceName}`}
              checked={selected}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-zk-border bg-zk-base text-zk-indigo focus:ring-2 focus:ring-zk-indigo/50 focus:ring-offset-2 focus:ring-offset-zk-elevated"
              onChange={onToggleSelect}
              onClick={(e) => {
                e.stopPropagation();
              }}
              type="checkbox"
            />
          ) : null}
          <div className="h-10 w-1 -translate-x-2 rounded-full bg-gradient-to-b from-transparent from-20% via-zk-indigo/80 via-50% to-transparent to-80% group-hover:via-zk-indigo"></div>
          <div className={cn("min-w-0 max-w-[350px] flex-shrink-0")}>
            <div className="m-0 flex w-full min-w-0 items-center border-none bg-transparent p-0 text-left">
              <div className="group/service relative inline-flex max-w-[300px] min-w-0">
                <h3 className="text-md max-w-[300px] truncate font-zk-sans font-medium text-zk-text">
                  {credential.serviceName.length > 12
                    ? credential.serviceName.slice(0, 16) + "…"
                    : credential.serviceName}
                </h3>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg border border-zk-border bg-zk-elevated p-3 text-xs text-zk-muted opacity-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] transition-opacity duration-200 whitespace-pre-wrap break-words group-hover/service:opacity-100">
                  Use the menu to copy or show values
                </div>
              </div>
              <span className="ml-2 flex shrink-0 items-center gap-2">
                {category !== "none" && (
                  <span className="rounded-full border border-zk-border bg-zk-base/60 px-2 py-0.5 font-zk-sans text-[10px] capitalize text-zk-muted transition-colors group-hover:border-zk-indigo/25 group-hover:text-zk-text">
                    {category}
                  </span>
                )}
                {credential.notes && (
                  <div className="group/notes relative flex items-center">
                    <Info
                      className="h-4 w-4 text-zk-muted transition-colors group-hover:text-zk-text"
                      strokeWidth={1.5}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg border border-zk-border bg-zk-elevated p-3 text-xs text-zk-muted opacity-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] transition-opacity duration-200 whitespace-pre-wrap break-words group-hover/notes:opacity-100">
                      {credential.notes}
                    </div>
                  </div>
                )}
                {credential.apiSecret && (
                  <span className="text-zk-cyan/90">
                    <BookLock className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </span>
                )}
              </span>
            </div>
            <p className="relative flex items-center gap-1 font-zk-sans text-xs text-zk-muted">
              Saved entry
              <span className="text-zk-muted/80">
                · Added {formatTimestamp(credential.createdAt)}
              </span>
            </p>
          </div>
        </div>

        {/* Credentials */}
        <div className="flex max-w-[80%] flex-1 items-center justify-center gap-2">
          <div
            className={cn(
              "flex w-full flex-col items-stretch justify-between gap-2 font-zk-mono text-xs md:flex-row md:items-center",
            )}
          >
            {/* API Key */}
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-zk-border bg-zk-base/50 p-2">
              <span className="mr-2 flex-shrink-0 text-zk-muted">Key</span>
              <span className="min-w-0 flex-1 truncate text-zk-text">
                {maskCredential(credential.apiKey, isApiKeyRevealed)}
              </span>
            </div>

            {/* API Secret */}
            {hasSecret && (
              <div className="flex min-w-0 flex-1 items-center rounded-lg border border-zk-border bg-zk-base/50 p-2">
                <span className="mr-2 flex-shrink-0 text-zk-muted">Secret</span>
                <span className="min-w-0 flex-1 truncate text-zk-text">
                  {credential.apiSecret &&
                    maskCredential(credential.apiSecret, isApiSecretRevealed)}
                </span>
              </div>
            )}
          </div>
          {/* Card actions — kebab menu */}
          <div
            className="relative flex shrink-0 self-start md:self-center"
            ref={menuWrapRef}
          >
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More options for this entry"
              className="rounded-lg p-2 text-zk-muted transition-colors duration-200 hover:bg-zk-base/80 hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
              onClick={() => {
                setMenuOpen((o) => !o);
              }}
              type="button"
            >
              <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-[200] mt-1 w-56 rounded-xl border border-zk-border bg-zk-elevated py-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/20"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                role="menu"
              >
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
                  onClick={() => {
                    onCopyServiceName();
                    setMenuOpen(false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  {isServiceNameCopied ? (
                    <CheckCircle
                      className="h-4 w-4 shrink-0 text-zk-safe"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Copy
                      className="h-4 w-4 shrink-0 text-zk-muted"
                      strokeWidth={1.5}
                    />
                  )}
                  Copy name
                </button>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
                  onClick={() => {
                    onCopyApiKey();
                    setMenuOpen(false);
                  }}
                  role="menuitem"
                  type="button"
                >
                  {isApiKeyCopied || clipboardTimeoutApiKey ? (
                    <CheckCircle
                      className="h-4 w-4 shrink-0 text-zk-safe"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Copy
                      className="h-4 w-4 shrink-0 text-zk-muted"
                      strokeWidth={1.5}
                    />
                  )}
                  Copy key
                </button>
                {hasSecret && (
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
                    onClick={() => {
                      onCopyApiSecret();
                      setMenuOpen(false);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    {isApiSecretCopied || clipboardTimeoutApiSecret ? (
                      <CheckCircle
                        className="h-4 w-4 shrink-0 text-zk-safe"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Copy
                        className="h-4 w-4 shrink-0 text-zk-muted"
                        strokeWidth={1.5}
                      />
                    )}
                    Copy secret
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
                  onClick={onToggleApiKeyReveal}
                  role="menuitem"
                  type="button"
                >
                  {isApiKeyRevealed ? (
                    <EyeOff
                      className="h-4 w-4 shrink-0 text-amber-300/90"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Eye
                      className="h-4 w-4 shrink-0 text-zk-muted"
                      strokeWidth={1.5}
                    />
                  )}
                  {isApiKeyRevealed ? "Hide key" : "Show key"}
                </button>
                {hasSecret && (
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
                    onClick={onToggleApiSecretReveal}
                    role="menuitem"
                    type="button"
                  >
                    {isApiSecretRevealed ? (
                      <EyeOff
                        className="h-4 w-4 shrink-0 text-amber-300/90"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 shrink-0 text-zk-muted"
                        strokeWidth={1.5}
                      />
                    )}
                    {isApiSecretRevealed ? "Hide secret" : "Show secret"}
                  </button>
                )}
                <div
                  aria-hidden
                  className="my-1 border-t border-zk-border"
                />
                {needsUpdate ? (
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-safe transition-colors hover:bg-zk-safe/10"
                    onClick={() => {
                      setMenuOpen(false);
                      onUpdateNeeded?.();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <RefreshCw className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    Update entry
                  </button>
                ) : (
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <SquarePen
                      className="h-4 w-4 shrink-0 text-zk-indigo"
                      strokeWidth={1.5}
                    />
                    Edit
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-zk-sans text-sm text-red-400/95 transition-colors hover:bg-red-950/30 hover:text-red-300"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialCard;

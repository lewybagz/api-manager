import { type Timestamp } from "firebase/firestore";
import {
  BookLock,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  SquarePen,
  Trash2,
} from "lucide-react";
import React from "react";

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
  onUpdateNeeded?: () => void; // Optional, only if credential needs update
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
  onUpdateNeeded,
}) => {
  const hasSecret = credential.apiSecret && credential.apiSecret.length > 0;
  const category = (credential.category ?? "none").toLowerCase();

  return (
    <div
      className={cn(
        "group relative w-full overflow-visible border-0 border-b border-zk-border bg-zk-elevated/35 backdrop-blur-sm transition-colors duration-200 last:border-b-0 hover:bg-zk-elevated/55",
        className,
      )}
    >
      <div className="flex flex-col items-start justify-between gap-0 p-2 px-4 md:flex-row md:items-center">
        {/* Service Info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-1 -translate-x-2 rounded-full bg-gradient-to-b from-transparent from-20% via-zk-indigo/80 via-50% to-transparent to-80% group-hover:via-zk-indigo"></div>
          <div className={cn("min-w-0 max-w-[350px] flex-shrink-0")}>
            <button
              aria-label="Copy service name to clipboard"
              className="group/btn m-0 flex w-full items-center border-none bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
              onClick={onCopyServiceName}
              title="Copy service name"
              type="button"
            >
              <div className="group/service relative inline-flex max-w-[300px]">
                <h3 className="text-md max-w-[300px] font-zk-sans font-medium text-zk-text transition-colors duration-200 group-hover:text-zk-text">
                  {credential.serviceName.length > 12
                    ? credential.serviceName.slice(0, 16) + "…"
                    : credential.serviceName}
                </h3>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg border border-zk-border bg-zk-elevated p-3 text-xs text-zk-muted opacity-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] transition-opacity duration-200 whitespace-pre-wrap break-words group-hover/service:opacity-100">
                  Tap to copy this name
                </div>
              </div>
              <span className="ml-2 flex items-center gap-2">
                {category !== "none" && (
                  <span className="rounded-full border border-zk-border bg-zk-base/60 px-2 py-0.5 font-zk-sans text-[10px] capitalize text-zk-muted transition-colors group-hover:border-zk-indigo/25 group-hover:text-zk-text">
                    {category}
                  </span>
                )}
                {isServiceNameCopied ? (
                  <CheckCircle className="h-4 w-4 text-zk-safe" strokeWidth={1.5} />
                ) : (
                  <Copy
                    className="h-4 w-4 text-zk-muted transition-colors duration-200 group-hover:text-zk-text"
                    strokeWidth={1.5}
                  />
                )}
                {credential.notes && (
                  <div className="group/notes relative flex items-center">
                    <Info
                      className="h-4 w-4 cursor-pointer text-zk-muted transition-colors group-hover:text-zk-text"
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
            </button>
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
              <span className="flex-1 truncate text-zk-text">
                {maskCredential(credential.apiKey, isApiKeyRevealed)}
              </span>
              <div className="ml-2 flex flex-shrink-0 items-center">
                <button
                  className={cn(
                    "rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35",
                    isApiKeyCopied || clipboardTimeoutApiKey
                      ? "text-zk-safe"
                      : "text-zk-muted hover:text-zk-indigo",
                  )}
                  onClick={onCopyApiKey}
                  title="Copy key"
                  type="button"
                >
                  {isApiKeyCopied || clipboardTimeoutApiKey ? (
                    <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                </button>
                <button
                  className={cn(
                    "rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35",
                    isApiKeyRevealed
                      ? "text-amber-300/90"
                      : "text-zk-muted hover:text-zk-indigo",
                  )}
                  onClick={onToggleApiKeyReveal}
                  title={isApiKeyRevealed ? "Hide" : "Show"}
                  type="button"
                >
                  {isApiKeyRevealed ? (
                    <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* API Secret */}
            {hasSecret && (
              <div className="flex min-w-0 flex-1 items-center rounded-lg border border-zk-border bg-zk-base/50 p-2">
                <span className="mr-2 flex-shrink-0 text-zk-muted">Secret</span>
                <span className="flex-1 truncate text-zk-text">
                  {credential.apiSecret &&
                    maskCredential(credential.apiSecret, isApiSecretRevealed)}
                </span>
                <div className="ml-2 flex flex-shrink-0 items-center">
                  <button
                    className={cn(
                      "rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35",
                      isApiSecretCopied || clipboardTimeoutApiSecret
                        ? "text-zk-safe"
                        : "text-zk-muted hover:text-zk-indigo",
                    )}
                    onClick={onCopyApiSecret}
                    title="Copy secret"
                    type="button"
                  >
                    {isApiSecretCopied || clipboardTimeoutApiSecret ? (
                      <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    className={cn(
                      "rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35",
                      isApiSecretRevealed
                        ? "text-amber-300/90"
                        : "text-zk-muted hover:text-zk-indigo",
                    )}
                    onClick={onToggleApiSecretReveal}
                    title={isApiSecretRevealed ? "Hide" : "Show"}
                    type="button"
                  >
                    {isApiSecretRevealed ? (
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col items-center gap-1.5 self-start md:flex-row md:self-center">
            {credential.apiKey === "PLACEHOLDER-RESET-VALUE" &&
            onUpdateNeeded ? (
              <button
                className="flex items-center rounded-lg bg-zk-safe/15 p-2 text-xs text-zk-safe transition-all duration-200 hover:bg-zk-safe/25"
                onClick={onUpdateNeeded}
                title="This entry needs an update"
                type="button"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:mr-1" strokeWidth={1.5} />
                <span className="hidden sm:inline">Update</span>
              </button>
            ) : (
              <button
                className="rounded-lg p-2 text-zk-muted transition-colors duration-200 hover:bg-zk-base/80 hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
                onClick={onEdit}
                title="Edit"
                type="button"
              >
                <SquarePen className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}

            <button
              className="rounded-lg p-2 text-red-400/90 transition-colors duration-200 hover:bg-red-950/35 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              onClick={onDelete}
              title="Remove"
              type="button"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialCard;

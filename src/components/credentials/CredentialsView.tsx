import { Plus, Search, Shield, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import useCredentialStore, {
  type DecryptedCredential,
} from "../../stores/credentialStore";
import CredentialCard from "./CredentialCard";

interface CredentialsViewProps {
  clipboardTimeout: Record<string, ReturnType<typeof setTimeout>>;
  copiedStates: Record<string, boolean>;
  credentials: DecryptedCredential[];
  error: Error | null;
  hasActiveFilters?: boolean;
  isLoading: boolean;
  maskCredential: (value: string, revealed: boolean) => string;
  onCopy: (text: string, id: string) => void;
  onDeleteCredential: (credential: DecryptedCredential) => void;
  onEditCredential: (credential: DecryptedCredential) => void;
  onToggleReveal: (fieldId: string) => void;
  onUpdateCategory?: (
    credential: DecryptedCredential,
    newCategory: string
  ) => void;
  projectId: string;
  revealedStates: Record<string, boolean>;
  searchQuery?: string;
}

const CredentialsView: React.FC<CredentialsViewProps> = ({
  clipboardTimeout,
  copiedStates,
  credentials,
  error,
  hasActiveFilters = false,
  isLoading,
  maskCredential,
  onCopy,
  onDeleteCredential,
  onEditCredential,
  onToggleReveal,
  onUpdateCategory,
  projectId,
  revealedStates,
  searchQuery = "",
}) => {
  const { deleteCredential } = useCredentialStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const sortedCredentials = useMemo(
    () =>
      [...credentials].sort(
        (a, b) =>
          (b.apiSecret && b.apiSecret.length > 0 ? 1 : 0) -
          (a.apiSecret && a.apiSecret.length > 0 ? 1 : 0)
      ),
    [credentials]
  );

  const visibleIds = useMemo(
    () => sortedCredentials.map((c) => c.id),
    [sortedCredentials]
  );

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => visibleIds.includes(id)));
  }, [visibleIds]);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected =
    selectedIds.length > 0 && !allVisibleSelected;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) {
      el.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(visibleIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleOpenBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (!projectId || selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    const idsToDelete = [...selectedIds];
    let failed = 0;
    for (const id of idsToDelete) {
      try {
        await deleteCredential(id, projectId);
      } catch {
        failed++;
      }
    }
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
    setIsBulkDeleting(false);
    if (failed === 0) {
      toast.success(
        idsToDelete.length === 1
          ? "Entry removed"
          : `${idsToDelete.length} entries removed`,
        { description: "They have been deleted from this project." }
      );
    } else if (failed < idsToDelete.length) {
      toast.warning("Some entries could not be removed", {
        description: `${idsToDelete.length - failed} removed, ${failed} failed.`,
      });
    } else {
      toast.error("Could not remove selected entries", {
        description: "Please try again later.",
      });
    }
  };

  const showEmptyState = !isLoading && !error && sortedCredentials.length === 0;
  const showCredentials = sortedCredentials.length > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 border-none bg-transparent p-12 text-center font-zk-sans text-zk-text">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zk-border">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold tracking-[-0.02em]">Loading your list</p>
          <p className="text-sm text-zk-muted">Getting things ready…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {error && (
        <div className="border-none bg-transparent">
          <div className="flex items-start gap-4 rounded-xl border border-red-500/35 bg-red-950/20 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
              <Shield className="h-5 w-5 text-red-400/95" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="mb-2 font-zk-sans text-xl font-semibold text-red-300/95">
                Something went wrong
              </h3>
              <p className="font-zk-sans text-sm leading-relaxed text-red-200/80">
                {error.message}. Some items may be missing until this is resolved.
              </p>
            </div>
          </div>
        </div>
      )}

      {showEmptyState && (
        <div className="border-none bg-transparent py-16 text-center font-zk-sans">
          {hasActiveFilters ? (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zk-border bg-zk-elevated/50">
                <Search className="h-8 w-8 text-zk-muted" strokeWidth={1.5} />
              </div>
              <h2 className="mb-4 text-2xl font-semibold tracking-[-0.02em] text-zk-text sm:text-3xl">
                No matches
              </h2>
              <p className="mx-auto mb-8 max-w-md leading-relaxed text-zk-muted">
                Nothing matches &quot;{searchQuery.trim()}&quot;. Try another search or
                pick a different category.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zk-border bg-zk-elevated/50">
                <Plus className="h-8 w-8 text-zk-muted" strokeWidth={1.5} />
              </div>
              <h2 className="mb-4 text-2xl font-semibold tracking-[-0.02em] text-zk-text sm:text-3xl">
                Nothing here yet
              </h2>
              <p className="mx-auto mb-8 max-w-md leading-relaxed text-zk-muted">
                Add your first saved key for this project. It stays private to
                you and is stored securely.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl border border-zk-border bg-zk-base/50 px-5 py-3 text-sm font-medium text-zk-muted">
                <Shield className="h-4 w-4 shrink-0 text-zk-cyan/85" strokeWidth={1.5} />
                <span>Protected while you work</span>
              </div>
            </>
          )}
        </div>
      )}

      {showCredentials && (
        <div className="space-y-8 overflow-visible">
          <div className="overflow-visible rounded-2xl border border-zk-border bg-zk-base/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zk-border bg-zk-elevated/50 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  aria-label={
                    allVisibleSelected ? "Deselect all entries" : "Select all entries"
                  }
                  checked={allVisibleSelected}
                  className="h-4 w-4 cursor-pointer rounded border-zk-border bg-zk-base text-zk-indigo focus:ring-2 focus:ring-zk-indigo/50 focus:ring-offset-2 focus:ring-offset-zk-elevated"
                  onChange={handleSelectAllToggle}
                  ref={selectAllRef}
                  type="checkbox"
                />
                <span className="font-zk-sans text-sm text-zk-muted">
                  {allVisibleSelected ? "Deselect all" : "Select all"}
                </span>
              </label>
              {selectedIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-zk-sans text-sm text-zk-muted">
                    {selectedIds.length} selected
                  </span>
                  <button
                    className="rounded-lg border border-zk-border px-3 py-1.5 font-zk-sans text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
                    onClick={handleClearSelection}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600/90 px-3 py-1.5 font-zk-sans text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-50"
                    disabled={isBulkDeleting}
                    onClick={handleOpenBulkDelete}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    Remove selected
                  </button>
                </div>
              ) : null}
            </div>
            {sortedCredentials.map((cred, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === sortedCredentials.length - 1;
              let rounded = "";
              if (isFirst && isLast) {
                rounded = "rounded-t-2xl rounded-b-2xl";
              } else if (isFirst) {
                rounded = "rounded-t-2xl";
              } else if (isLast) {
                rounded = "rounded-b-2xl";
              }
              return (
                <CredentialCard
                  className={rounded}
                  clipboardTimeoutApiKey={
                    !!clipboardTimeout[`${cred.id}-apikey`]
                  }
                  clipboardTimeoutApiSecret={
                    !!clipboardTimeout[`${cred.id}-apisecret`]
                  }
                  credential={cred}
                  credentialHasNote={!!cred.notes}
                  credentialHasSecret={
                    !!cred.apiSecret && cred.apiSecret.length > 0
                  }
                  isApiKeyCopied={copiedStates[`${cred.id}-apikey`] ?? false}
                  isApiKeyRevealed={
                    revealedStates[`${cred.id}-apikey`] ?? false
                  }
                  isApiSecretCopied={
                    copiedStates[`${cred.id}-apisecret`] ?? false
                  }
                  isApiSecretRevealed={
                    revealedStates[`${cred.id}-apisecret`] ?? false
                  }
                  isServiceNameCopied={copiedStates[cred.id] ?? false}
                  key={cred.id}
                  maskCredential={maskCredential}
                  onChangeCategory={(newCategory: string) => {
                    onUpdateCategory?.(cred, newCategory);
                  }}
                  onCopyApiKey={() => {
                    onCopy(cred.apiKey, `${cred.id}-apikey`);
                  }}
                  onCopyApiSecret={() => {
                    if (cred.apiSecret) {
                      onCopy(cred.apiSecret, `${cred.id}-apisecret`);
                    }
                  }}
                  onCopyServiceName={() => {
                    onCopy(cred.serviceName, cred.id);
                  }}
                  onDelete={() => {
                    onDeleteCredential(cred);
                  }}
                  onEdit={() => {
                    onEditCredential(cred);
                  }}
                  onToggleSelect={() => {
                    handleToggleSelect(cred.id);
                  }}
                  selected={selectedIds.includes(cred.id)}
                  onToggleApiKeyReveal={() => {
                    onToggleReveal(`${cred.id}-apikey`);
                  }}
                  onToggleApiSecretReveal={() => {
                    onToggleReveal(`${cred.id}-apisecret`);
                  }}
                  onUpdateNeeded={
                    cred.apiKey === "PLACEHOLDER-RESET-VALUE"
                      ? () => {
                          onEditCredential(cred);
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>

          {showBulkDeleteConfirm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
                <div className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                    <Trash2 className="h-6 w-6 text-white" strokeWidth={1.5} />
                  </div>
                  <h2 className="mb-3 text-xl font-semibold text-red-400/95">
                    Remove {selectedIds.length}{" "}
                    {selectedIds.length === 1 ? "entry" : "entries"}?
                  </h2>
                  <p className="mb-6 text-sm text-zk-muted">
                    This will permanently delete the selected saved keys from
                    this project.
                  </p>
                  <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                    <p className="text-center text-sm text-amber-200/85">
                      You cannot undo this.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 disabled:opacity-50"
                      disabled={isBulkDeleting}
                      onClick={() => {
                        setShowBulkDeleteConfirm(false);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      disabled={isBulkDeleting}
                      onClick={() => {
                        void handleConfirmBulkDelete();
                      }}
                      type="button"
                    >
                      {isBulkDeleting ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {error && error.message.toLowerCase().includes("decrypt") && (
            <div className="border-none bg-transparent">
              <div className="flex items-start gap-4 rounded-xl border border-amber-500/35 bg-amber-950/20 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                  <Shield className="h-5 w-5 text-amber-200/90" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="mb-2 font-zk-sans text-xl font-semibold text-amber-100/95">
                    A few items need attention
                  </h3>
                  <p className="mb-4 font-zk-sans text-sm leading-relaxed text-amber-200/80">
                    Something could not be opened with your current unlock. If
                    you see Update on a row, open it and save the correct values.
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/25 px-4 py-2 font-zk-sans text-sm text-amber-100/90">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-amber-300/90" />
                    Look for rows with Update
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CredentialsView;

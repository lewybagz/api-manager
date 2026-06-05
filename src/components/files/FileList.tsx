import { FileText, FolderOpen, Search, Trash2, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import useAuthStore from "../../stores/authStore";
import useFileStore, { type FileMetadata } from "../../stores/fileStore";
import FilePreviewModal from "./FilePreviewModal";
import ProjectFileCard from "./ProjectFileCard";

interface FileListProps {
  projectId: string;
  searchQuery: string;
}

const FileList: React.FC<FileListProps> = ({ projectId, searchQuery }) => {
  const {
    deleteFile,
    error,
    fetchFilesForProject,
    isLoading,
    prepareDownloadableFile,
    projectFiles,
  } = useFileStore();
  const { encryptionKey, openMasterPasswordModal } = useAuthStore();

  const filesForCurrentProject = projectFiles[projectId] ?? [];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredFiles = filesForCurrentProject.filter((file) => {
    if (!normalizedSearchQuery) return true;

    const searchableContent = [
      file.fileName,
      file.contentType,
      file.id,
      file.storagePath,
      file.isEncrypted ? "encrypted" : "unencrypted",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedSearchQuery);
  });

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuFileId, setOpenMenuFileId] = useState<null | string>(null);
  const [fileToDownloadAfterUnlock, setFileToDownloadAfterUnlock] =
    useState<FileMetadata | null>(null);
  const [isPreparingDownload, setIsPreparingDownload] = useState<
    Record<string, boolean>
  >({});
  const [fileToPreview, setFileToPreview] = useState<FileMetadata | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const visibleIds = useMemo(
    () => filteredFiles.map((f) => f.id),
    [filteredFiles]
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
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    const idsToDelete = [...selectedIds];
    const filesById = new Map(
      filesForCurrentProject.map((f) => [f.id, f] as const)
    );
    let failed = 0;
    for (const id of idsToDelete) {
      const file = filesById.get(id);
      if (!file) {
        failed++;
        continue;
      }
      try {
        await deleteFile(file);
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
          ? "File removed"
          : `${idsToDelete.length} files removed`
      );
    } else if (failed < idsToDelete.length) {
      toast.warning("Some files could not be removed", {
        description: `${idsToDelete.length - failed} removed, ${failed} failed.`,
      });
    } else {
      toast.error("Could not remove selected files");
    }
  };

  useEffect(() => {
    if (projectId) {
      void fetchFilesForProject(projectId);
    }
  }, [fetchFilesForProject, projectId]);

  const handleDownload = useCallback(
    async (file: FileMetadata) => {
      setIsPreparingDownload((prev) => ({ ...prev, [file.id]: true }));
      const toastId = toast.loading(
        `Preparing ${file.fileName} for download...`
      );
      try {
        const objectUrl = await prepareDownloadableFile(file);
        if (objectUrl) {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = file.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
          toast.success("Download started", { id: toastId });
        } else if (file.isEncrypted && !encryptionKey) {
          setFileToDownloadAfterUnlock(file);
          openMasterPasswordModal();
          toast.error("Session Locked", {
            description: "Unlock your session to download this encrypted file.",
            id: toastId,
          });
        } else {
          toast.error("Could not prepare file for download", { id: toastId });
        }
      } catch {
        toast.error("Download failed", { id: toastId });
      } finally {
        setIsPreparingDownload((prev) => ({ ...prev, [file.id]: false }));
        setOpenMenuFileId(null);
      }
    },
    [prepareDownloadableFile, encryptionKey, openMasterPasswordModal]
  );

  useEffect(() => {
    if (fileToDownloadAfterUnlock && encryptionKey) {
      const fileToRetry = fileToDownloadAfterUnlock;
      setFileToDownloadAfterUnlock(null);
      toast.info(
        `Session unlocked. Retrying download for ${fileToRetry.fileName}...`
      );
      void handleDownload(fileToRetry);
    }
  }, [encryptionKey, fileToDownloadAfterUnlock, handleDownload]);

  const handleDeleteRequest = (file: FileMetadata) => {
    setFileToDelete(file);
    setShowDeleteConfirmModal(true);
    setOpenMenuFileId(null);
  };

  const closeDeleteConfirmModal = () => {
    setFileToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handlePreviewRequest = (file: FileMetadata) => {
    setFileToPreview(file);
    setShowPreviewModal(true);
    setOpenMenuFileId(null);
  };

  const closePreviewModal = () => {
    setFileToPreview(null);
    setShowPreviewModal(false);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${fileToDelete.fileName}...`);
    try {
      await deleteFile(fileToDelete);
      toast.success("File deleted successfully", {
        description: `${fileToDelete.fileName} has been deleted.`,
        id: toastId,
      });
      closeDeleteConfirmModal();
    } catch {
      toast.error("Delete operation failed", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMenu = (fileId: string) => {
    setOpenMenuFileId((prevFileId) => (prevFileId === fileId ? null : fileId));
  };

  if (isLoading && filesForCurrentProject.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zk-border bg-zk-elevated/30 p-12 text-center">
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-zk-border">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold tracking-[-0.02em] text-zk-text">
            Loading files
          </p>
          <p className="text-sm text-zk-muted">Fetching your project files…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/35 bg-red-950/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-red-500/15">
          <XCircle className="h-8 w-8 text-red-400/95" strokeWidth={1.5} />
        </div>
        <h3 className="mb-3 text-xl font-semibold text-red-300/95">
          Couldn&apos;t load files
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-red-200/80">{error.message}</p>
        <button
          className="rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
          onClick={() => {
            void fetchFilesForProject(projectId);
          }}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  if (filesForCurrentProject.length === 0) {
    return (
      <div className="rounded-2xl border border-zk-border bg-zk-elevated/25 py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zk-border bg-zk-base/50">
          <FolderOpen className="h-8 w-8 text-zk-muted" strokeWidth={1.5} />
        </div>
        <h3 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-zk-text sm:text-2xl">
          No files yet
        </h3>
        <p className="mx-auto mb-6 max-w-md px-4 text-sm leading-relaxed text-zk-muted">
          Use the upload area above to add files. You can choose to protect them
          before they leave your device.
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-zk-border bg-zk-base/50 px-4 py-2 text-sm font-medium text-zk-muted">
          <FileText className="h-4 w-4 shrink-0 text-zk-indigo" strokeWidth={1.5} />
          <span>Drag a file in or click to browse</span>
        </div>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="rounded-2xl border border-zk-border bg-zk-elevated/25 py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zk-border bg-zk-base/50">
          <Search className="h-8 w-8 text-zk-muted" strokeWidth={1.5} />
        </div>
        <h3 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-zk-text sm:text-2xl">
          No matches
        </h3>
        <p className="mx-auto max-w-md px-4 text-sm leading-relaxed text-zk-muted">
          Nothing matches &quot;{searchQuery.trim()}&quot;. Try another search
          word or clear the project search bar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
          <FileText className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-zk-text sm:text-2xl">
            Project files
          </h2>
          <p className="text-sm text-zk-muted">
            {filteredFiles.length}{" "}
            {filteredFiles.length === 1 ? "file" : "files"}
            {normalizedSearchQuery ? " match" : ""} in this project
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zk-border bg-zk-elevated/40 px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            aria-label={
              allVisibleSelected ? "Deselect all files" : "Select all files"
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {filteredFiles.map((file) => (
          <ProjectFileCard
            file={file}
            isDownloading={isPreparingDownload[file.id] || false}
            isMenuOpen={openMenuFileId === file.id}
            key={file.id}
            onDelete={() => {
              handleDeleteRequest(file);
            }}
            onDownload={() => {
              void handleDownload(file);
            }}
            onPreview={() => {
              handlePreviewRequest(file);
            }}
            onToggleSelect={() => {
              handleToggleSelect(file.id);
            }}
            onToggleMenu={() => {
              toggleMenu(file.id);
            }}
            selected={selectedIds.includes(file.id)}
          />
        ))}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && fileToPreview && (
        <FilePreviewModal
          file={fileToPreview}
          isOpen={showPreviewModal}
          onClose={closePreviewModal}
        />
      )}

      {showBulkDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                <Trash2 className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="mb-3 text-xl font-semibold text-red-400/95">
                Remove {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "file" : "files"}?
              </h2>
              <p className="mb-6 text-sm text-zk-muted">
                This will permanently delete the selected files from this
                project.
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

      {showDeleteConfirmModal && fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                <Trash2 className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="mb-3 text-xl font-semibold text-red-400/95">
                Remove this file?
              </h2>
              <p className="mb-2 text-sm text-zk-muted">This will permanently delete</p>
              <p className="mb-6">
                <strong className="rounded-lg border border-zk-border bg-zk-base/60 px-3 py-1.5 text-lg text-red-300/95">
                  {fileToDelete.fileName}
                </strong>
              </p>
              <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                <p className="text-center text-sm text-amber-200/85">
                  You cannot undo this.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={closeDeleteConfirmModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={() => {
                    void confirmDelete();
                  }}
                  type="button"
                >
                  {isDeleting ? "Removing…" : "Remove file"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;

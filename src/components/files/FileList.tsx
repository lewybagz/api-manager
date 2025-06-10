import { FileText, Loader2, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import useAuthStore from "../../stores/authStore";
import useFileStore, { type FileMetadata } from "../../stores/fileStore";
import FilePreviewModal from "./FilePreviewModal";
import ProjectFileCard from "./ProjectFileCard";

interface FileListProps {
  projectId: string;
}

const FileList: React.FC<FileListProps> = ({ projectId }) => {
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

  useEffect(() => {
    if (projectId) {
      void fetchFilesForProject(projectId);
    }
  }, [projectId, fetchFilesForProject]);

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
      } catch (err) {
        console.error("Download error:", err);
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
    } catch (err: unknown) {
      console.error("Delete error:", err);
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
      <div className="text-center p-8 text-brand-light flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        <p className="text-sm text-gray-400">Loading project files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-lg">
        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-3" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">
          Error Loading Files
        </h3>
        <p className="text-red-400">{error.message}</p>
        <button
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md text-sm"
          onClick={() => {
            void fetchFilesForProject(projectId);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filesForCurrentProject.length === 0) {
    return (
      <div className="text-center p-8 bg-brand-dark-secondary rounded-lg shadow-md">
        <FileText className="h-12 w-12 mx-auto text-gray-500 mb-3" />
        <h3 className="text-xl font-semibold text-brand-light mb-2">
          No Files Uploaded
        </h3>
        <p className="text-brand-light-secondary">
          Upload files using the area above to see them listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-brand-light mb-4">
        Project Files
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filesForCurrentProject.map((file) => (
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
            onToggleMenu={() => {
              toggleMenu(file.id);
            }}
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

      {/* Delete File Confirmation Modal */}
      {showDeleteConfirmModal && fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-brand-dark p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-red-500">
              Confirm File Deletion
            </h2>
            <p className="text-brand-light-secondary mb-2">
              Are you sure you want to delete the file <br />
              <strong className="text-red-400">
                {"'"}
                {fileToDelete.fileName}
                {"'"}
              </strong>
              ?
            </p>
            <p className="text-sm text-yellow-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-600 text-brand-light-secondary rounded-md hover:bg-gray-700 disabled:opacity-50"
                disabled={isDeleting}
                onClick={closeDeleteConfirmModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => {
                  void confirmDelete();
                }}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;

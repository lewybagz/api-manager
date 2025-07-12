import { FileText, FolderOpen, XCircle } from "lucide-react";
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
  }, [projectId]);

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
      <div className="text-center p-12 text-brand-light flex flex-col items-center gap-4 bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50">
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Loading Project Files</p>
          <p className="text-sm text-gray-400">Fetching your secure files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-gradient-to-r from-red-900/40 to-red-800/30 border border-red-500/50 rounded-2xl backdrop-blur-sm">
        <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-xl text-red-300 mb-3">Error Loading Files</h3>
        <p className="text-red-400 mb-6 leading-relaxed">{error.message}</p>
        <button
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
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
      <div className="mt-6 text-center p-12 bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <FolderOpen className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-2xl text-brand-light mb-4">No Files Uploaded</h3>
        <p className="text-brand-light-secondary mb-6 max-w-md mx-auto leading-relaxed">
          Upload files using the area above to see them listed here. Your files
          will be securely stored and optionally encrypted.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-blue/20 to-brand-primary/20 border border-brand-blue/30 text-brand-blue rounded-xl text-sm">
          <FileText className="h-4 w-4 mr-2" />
          <span>Drag & drop files to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-4">
      {/* Enhanced Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl text-brand-light">Project Files</h2>
          <p className="text-sm text-gray-400">
            {filesForCurrentProject.length}{" "}
            {filesForCurrentProject.length === 1 ? "file" : "files"} in this
            project
          </p>
        </div>
      </div>

      {/* Enhanced Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Enhanced Delete File Confirmation Modal */}
      {showDeleteConfirmModal && fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl mb-4 text-red-400 text-center">
                Delete File
              </h2>
              <p className="text-brand-light-secondary mb-2 text-center">
                Are you sure you want to delete
              </p>
              <p className="text-center mb-6">
                <strong className="text-red-400 text-lg bg-gray-800/50 px-3 py-1 rounded-lg">
                  {fileToDelete.fileName}
                </strong>
              </p>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-400 text-center">
                  ⚠️ This action cannot be undone
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-3 border border-gray-600 text-brand-light-secondary hover:bg-gray-700/50 hover:text-brand-light rounded-xl font-medium disabled:opacity-50 transition-all duration-200"
                  disabled={isDeleting}
                  onClick={closeDeleteConfirmModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  disabled={isDeleting}
                  onClick={() => {
                    void confirmDelete();
                  }}
                  type="button"
                >
                  {isDeleting ? "Deleting..." : "Delete File"}
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

import {
  Download,
  Eye,
  Loader2,
  MoreVertical,
  Shield,
  Trash2,
} from "lucide-react";
import React from "react";

import { type FileMetadata } from "../../stores/fileStore";
import { getFileIconPlaceholder } from "../../utils/fileIcons";

interface ProjectFileCardProps {
  file: FileMetadata;
  isDownloading?: boolean;
  isMenuOpen: boolean;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
  onToggleMenu: () => void;
}

const SUPPORTED_PREVIEW_TYPES = [
  "image/",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/pdf",
];

const isPreviewSupported = (contentType: string) => {
  return SUPPORTED_PREVIEW_TYPES.some((type) => contentType.startsWith(type));
};

const ProjectFileCard: React.FC<ProjectFileCardProps> = ({
  file,
  isDownloading,
  isMenuOpen,
  onDelete,
  onDownload,
  onPreview,
  onToggleMenu,
}) => {
  const fileSize =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(2)} KB`;

  // Get the icon placeholder using the utility function
  const iconPlaceholder = getFileIconPlaceholder(file.fileName);

  // Format uploaded date
  const uploadedDate = new Date(
    // Firestore Timestamp: .seconds to ms
    (file.uploadedAt.seconds || 0) * 1000
  ).toLocaleDateString();

  return (
    <div className="relative bg-brand-dark-secondary border border-border border-l-4 border-l-brand-blue border-r-4 border-r-brand-blue rounded-lg shadow-sm p-6 flex flex-col gap-4 min-w-0 w-[85vw] md:w-[25vw] mx-auto transition-shadow hover:shadow-md min-h-[180px] h-full">
      {/* Preview icon button (if supported) */}
      {isPreviewSupported(file.contentType) && (
        <button
          aria-label="Preview file"
          className="absolute top-2 left-2 z-10 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          title="Preview file"
        >
          <Eye className="h-5 w-5" />
        </button>
      )}
      {/* Absolutely positioned more options button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          aria-label="More options"
          className="p-2 text-gray-400 hover:text-brand-blue rounded-full transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
        >
          {isDownloading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MoreVertical className="h-5 w-5" />
          )}
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-brand-dark rounded-md shadow-lg z-10">
            <button
              className="w-full text-left px-4 py-2 text-sm text-brand-light-secondary hover:bg-gray-700 flex items-center gap-2"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-brand-light-secondary hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isPreviewSupported(file.contentType)}
              onClick={onPreview}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/50 flex items-center gap-2"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
      {/* Header: Icon and filename */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-800 rounded-md text-xs text-gray-300 border border-gray-700">
          <img
            alt={file.fileName + " icon"}
            className="w-8 h-8 object-contain"
            draggable={false}
            src={iconPlaceholder}
          />
        </div>
        <span className="text-base font-semibold text-brand-blue truncate block min-w-0">
          {file.fileName}
        </span>
      </div>
      {/* File size and metadata */}
      <div className="space-y-1">
        <p className="text-xs text-gray-400">{fileSize}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>Type: {file.contentType}</span>
          <span>Uploaded: {uploadedDate}</span>
          <span>ID: {file.id}</span>
        </div>
      </div>
      {/* Encrypted badge, if needed */}
      {file.isEncrypted && (
        <span
          className="absolute bottom-2 right-4 flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded-md border border-blue-500 text-blue-400 text-xs font-medium shadow-sm"
          title="This file is encrypted"
        >
          <Shield className="h-4 w-4 text-blue-400" />
          Encrypted
        </span>
      )}
    </div>
  );
};

export default ProjectFileCard;

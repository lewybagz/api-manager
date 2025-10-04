import {
  Download,
  Eye,
  Loader2,
  MoreVertical,
  Shield,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

import { type FileMetadata } from "../../stores/fileStore";
import {
  getFileIconPlaceholder,
  getFileTypeColor,
} from "../../utils/fileIcons";

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
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/sql",
  "application/x-httpd-php",
  "application/x-sh",
  "application/x-bat",
  "application/pdf",
];

const MAX_INLINE_PREVIEW_BYTES = 25 * 1024 * 1024; // 25 MB cap

function getLocalStorageLimit(key: string, defaultValue: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return defaultValue;
    return Math.min(n, 500 * 1024 * 1024);
  } catch {
    return defaultValue;
  }
}

const isPreviewSupported = (contentType: string, size?: number) => {
  const okType = SUPPORTED_PREVIEW_TYPES.some((type) =>
    contentType.startsWith(type)
  );
  if (!okType) return false;
  const limit = getLocalStorageLimit(
    "preview.binaryMaxBytes",
    MAX_INLINE_PREVIEW_BYTES
  );
  if (typeof size === "number" && size > limit) return false;
  return true;
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

  const borderColor = getFileTypeColor(file.fileName, file.contentType);

  // Tooltip state (non-invasive, anchored above the card)
  const [showTip, setShowTip] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<null | string>(null);

  const resolveCategoryLabel = (
    fileName: string,
    contentType: string
  ): string => {
    const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
    if (contentType.startsWith("image/")) return "Images";
    if (contentType.startsWith("video/")) return "Videos";
    if (contentType.startsWith("audio/")) return "Audio";
    if (contentType === "application/pdf" || ext === "pdf") return "PDF";
    if (
      contentType === "application/zip" ||
      ["7z", "gz", "rar", "tar", "zip"].includes(ext)
    )
      return "Archives";
    if (contentType === "text/markdown" || ext === "md") return "Markdown";
    if (contentType === "application/json" || ext === "json") return "JSON";
    if (contentType === "text/plain") return "Plain Text";
    if (contentType === "application/octet-stream") return "Binary/Unknown";
    return "Code/Text";
  };
  return (
    <div
      className="relative bg-gradient-to-br from-brand-dark-secondary/90 to-brand-dark-secondary/70 backdrop-blur-xl border border-brand-blue/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 min-w-0 w-[85vw] md:w-[25vw] mx-auto transition-all duration-300 hover:shadow-2xl hover:shadow-brand-blue/20 min-h-[180px] h-full group"
      onMouseEnter={() => {
        setShowTip(true);
        setHoveredCategory(
          resolveCategoryLabel(file.fileName, file.contentType)
        );
      }}
      onMouseLeave={() => {
        setShowTip(false);
        setHoveredCategory(null);
      }}
      style={{ borderTop: `4px solid ${borderColor}` }}
    >
      {/* Enhanced Preview icon button (if supported) */}
      {isPreviewSupported(file.contentType, file.size) && (
        <button
          aria-label="Preview file"
          className="absolute top-3 left-3 z-10 p-2.5 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all duration-200 shadow-lg border border-gray-700/50 hover:border-brand-blue/30"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          title="Preview file"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}

      {/* Enhanced More options button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          aria-label="More options"
          className="p-2.5 text-gray-400 hover:text-brand-blue rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm transition-all duration-200 shadow-lg border border-gray-700/50 hover:border-brand-blue/30"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-brand-dark to-brand-dark-secondary backdrop-blur-xl border border-brand-blue/30 rounded-xl shadow-2xl z-10 overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 text-sm text-brand-light-secondary hover:bg-brand-blue/10 hover:text-brand-light flex items-center gap-3 transition-all duration-200 border-b border-gray-700/30"
              onClick={onDownload}
            >
              <Download className="h-4 w-4 text-brand-blue" />
              Download
            </button>
            <button
              className="w-full text-left px-4 py-3 text-sm text-brand-light-secondary hover:bg-brand-blue/10 hover:text-brand-light flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border-b border-gray-700/30"
              disabled={!isPreviewSupported(file.contentType, file.size)}
              onClick={onPreview}
            >
              <Eye className="h-4 w-4 text-green-400" />
              Preview
            </button>
            <button
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-3 transition-all duration-200"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {showTip && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-50 rounded-md border border-gray-700/60 bg-brand-dark-secondary px-3 py-2 text-[11px] text-brand-light shadow-lg">
          <div className="mb-1 font-semibold">Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "Images"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("img.png", "image/png"),
                }}
              />{" "}
              Images
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "Videos"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("vid.mp4", "video/mp4"),
                }}
              />{" "}
              Videos
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "Audio"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("snd.mp3", "audio/mpeg"),
                }}
              />{" "}
              Audio
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "PDF"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor(
                    "doc.pdf",
                    "application/pdf"
                  ),
                }}
              />{" "}
              PDF
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "Archives"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor(
                    "arc.zip",
                    "application/zip"
                  ),
                }}
              />{" "}
              Archives
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "Markdown"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor(
                    "readme.md",
                    "text/markdown"
                  ),
                }}
              />{" "}
              Markdown
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "JSON"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor(
                    "data.json",
                    "application/json"
                  ),
                }}
              />{" "}
              JSON
            </div>
            <div
              className={`flex items-center gap-1 ${
                hoveredCategory === "Plain Text"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("note.txt", "text/plain"),
                }}
              />{" "}
              Plain Text
            </div>
            <div
              className={`flex items-center gap-1 col-span-2 ${
                hoveredCategory === "Code/Text"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("main.ts", "text/plain"),
                }}
              />{" "}
              Code/Text
            </div>
            <div
              className={`flex items-center gap-1 col-span-2 ${
                hoveredCategory === "Binary/Unknown"
                  ? "font-semibold opacity-100 text-brand-light bg-brand-blue/15 border border-brand-blue/40 rounded px-1.5 py-0.5 shadow-sm"
                  : "opacity-70"
              }`}
            >
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor:
                    getFileTypeColor("file.bin", "application/octet-stream") ||
                    "#6b7280",
                }}
              />{" "}
              Binary/Unknown
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header: Icon and filename */}
      <div className="flex items-center gap-4 min-w-0 mt-2">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl text-xs text-gray-300 border border-gray-700/50 shadow-lg">
          <img
            alt={file.fileName + " icon"}
            className="w-8 h-8 object-contain"
            draggable={false}
            src={iconPlaceholder || "/placeholder.svg"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-base truncate block bg-gradient-to-r from-brand-blue/80 to-brand-blue/40 bg-clip-text text-transparent transition-all duration-300 group-hover:from-brand-blue group-hover:to-brand-primary">
            {file.fileName}
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full"></div>
            <span className="text-xs text-gray-400">Project File</span>
          </div>
        </div>
      </div>

      {/* Enhanced File size and metadata */}
      <div className="space-y-3 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-light">Size</span>
          <span className="text-sm text-brand-blue font-mono">{fileSize}</span>
        </div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>Type:</span>
            <span className="font-mono bg-gray-700/50 px-2 py-1 rounded-lg">
              {file.contentType}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Uploaded:</span>
            <span className="text-brand-light-secondary">{uploadedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>ID:</span>
            <span className="font-mono text-xs bg-gray-700/50 px-2 py-1 rounded-lg truncate max-w-[120px]">
              {file.id}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Encrypted badge */}
      {file.isEncrypted && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-gradient-to-r from-blue-900/60 to-blue-800/40 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/50 text-blue-300 text-xs font-semibold shadow-lg">
          <Shield className="h-3 w-3 text-blue-400" />
          <span>Encrypted</span>
        </div>
      )}
    </div>
  );
};

export default ProjectFileCard;

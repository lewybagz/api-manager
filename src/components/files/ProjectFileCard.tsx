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

  // Format upload date and time (locale-aware; never includes seconds)
  const uploadedLabel = new Date(
    (file.uploadedAt.seconds || 0) * 1000
  ).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const borderColor = getFileTypeColor(file.fileName, file.contentType);

  // Tooltip state (non-invasive, anchored above the card)
  const [showTip, setShowTip] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<null | string>(null);

  const legendRowClass = (label: null | string) =>
    hoveredCategory === label
      ? "rounded border border-zk-indigo/35 bg-zk-indigo/15 px-1.5 py-0.5 font-semibold text-zk-text shadow-sm"
      : "text-zk-muted opacity-70";

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
      className="group relative mx-auto flex h-full min-h-[180px] min-w-0 w-[85vw] flex-col gap-4 rounded-2xl border border-zk-border bg-zk-elevated/40 p-6 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.5)] transition-colors duration-200 hover:border-zk-indigo/25 hover:shadow-[0_20px_56px_-24px_rgba(0,0,0,0.55)] md:w-[25vw]"
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
          className="absolute left-3 top-3 z-10 rounded-xl border border-zk-border bg-zk-base/80 p-2.5 text-zk-muted shadow-sm backdrop-blur-sm transition-colors hover:border-zk-indigo/30 hover:bg-zk-elevated hover:text-zk-indigo focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          title="Preview file"
          type="button"
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}

      <div className="absolute right-3 top-3 z-10">
        <button
          aria-label="More options"
          className="rounded-xl border border-zk-border bg-zk-base/80 p-2.5 text-zk-muted shadow-sm backdrop-blur-sm transition-colors hover:border-zk-indigo/30 hover:bg-zk-elevated hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          type="button"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zk-indigo" strokeWidth={1.5} />
          ) : (
            <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-zk-border bg-zk-elevated shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <button
              className="flex w-full items-center gap-3 border-b border-zk-border px-4 py-3 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70"
              onClick={onDownload}
              type="button"
            >
              <Download className="h-4 w-4 shrink-0 text-zk-indigo" strokeWidth={1.5} />
              Download
            </button>
            <button
              className="flex w-full items-center gap-3 border-b border-zk-border px-4 py-3 text-left font-zk-sans text-sm text-zk-text transition-colors hover:bg-zk-base/70 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isPreviewSupported(file.contentType, file.size)}
              onClick={onPreview}
              type="button"
            >
              <Eye className="h-4 w-4 shrink-0 text-zk-cyan/90" strokeWidth={1.5} />
              Preview
            </button>
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left font-zk-sans text-sm text-red-400/95 transition-colors hover:bg-red-950/30 hover:text-red-300"
              onClick={onDelete}
              type="button"
            >
              <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Delete
            </button>
          </div>
        )}
      </div>

      {showTip && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-y-full -translate-x-1/2 rounded-lg border border-zk-border bg-zk-elevated px-3 py-2 font-zk-sans text-[11px] text-zk-text shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)]">
          <div className="mb-1 font-semibold text-zk-muted">Colors</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className={`flex items-center gap-1 ${legendRowClass("Images")}`}>
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("img.png", "image/png"),
                }}
              />{" "}
              Images
            </div>
            <div className={`flex items-center gap-1 ${legendRowClass("Videos")}`}>
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("vid.mp4", "video/mp4"),
                }}
              />{" "}
              Videos
            </div>
            <div className={`flex items-center gap-1 ${legendRowClass("Audio")}`}>
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("snd.mp3", "audio/mpeg"),
                }}
              />{" "}
              Audio
            </div>
            <div className={`flex items-center gap-1 ${legendRowClass("PDF")}`}>
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
            <div className={`flex items-center gap-1 ${legendRowClass("Archives")}`}>
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
            <div className={`flex items-center gap-1 ${legendRowClass("Markdown")}`}>
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
            <div className={`flex items-center gap-1 ${legendRowClass("JSON")}`}>
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
            <div className={`flex items-center gap-1 ${legendRowClass("Plain Text")}`}>
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("note.txt", "text/plain"),
                }}
              />{" "}
              Plain Text
            </div>
            <div className={`col-span-2 flex items-center gap-1 ${legendRowClass("Code/Text")}`}>
              <span
                className="inline-block h-2 w-4 rounded"
                style={{
                  backgroundColor: getFileTypeColor("main.ts", "text/plain"),
                }}
              />{" "}
              Code/Text
            </div>
            <div className={`col-span-2 flex items-center gap-1 ${legendRowClass("Binary/Unknown")}`}>
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

      <div className="mt-2 flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zk-border bg-zk-base/70 text-xs text-zk-muted shadow-sm">
          <img
            alt={file.fileName + " icon"}
            className="h-8 w-8 object-contain"
            draggable={false}
            src={iconPlaceholder || "/placeholder.svg"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate font-zk-sans text-base font-medium text-zk-text transition-colors group-hover:text-zk-text">
            {file.fileName}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-zk-indigo/80" />
            <span className="font-zk-sans text-xs text-zk-muted">Project file</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-zk-border bg-zk-base/40 p-4">
        <div className="flex items-center justify-between">
          <span className="font-zk-sans text-sm font-medium text-zk-text">Size</span>
          <span className="font-zk-mono text-sm text-zk-indigo">{fileSize}</span>
        </div>
        <div className="space-y-2 font-zk-sans text-xs text-zk-muted">
          <div className="flex items-center justify-between gap-2">
            <span>Type</span>
            <span className="max-w-[55%] truncate rounded-lg border border-zk-border bg-zk-elevated/50 px-2 py-1 font-zk-mono text-[10px] text-zk-text">
              {file.contentType}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Uploaded</span>
            <span className="text-zk-text/85">{uploadedLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>ID</span>
            <span className="max-w-[120px] truncate rounded-lg border border-zk-border bg-zk-elevated/50 px-2 py-1 font-zk-mono text-[10px] text-zk-muted">
              {file.id}
            </span>
          </div>
        </div>
      </div>

      {file.isEncrypted && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border border-zk-cyan/35 bg-zk-cyan/10 px-3 py-2 font-zk-sans text-xs font-medium text-zk-cyan shadow-sm backdrop-blur-sm">
          <Shield className="h-3 w-3 shrink-0 text-zk-cyan" strokeWidth={1.5} />
          <span>Encrypted</span>
        </div>
      )}
    </div>
  );
};

export default ProjectFileCard;

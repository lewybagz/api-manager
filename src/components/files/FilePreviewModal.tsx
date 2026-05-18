import { ExternalLink, FileText, X } from "lucide-react";
import React, { lazy, Suspense, useEffect, useState } from "react";

import useFileStore, { type FileMetadata } from "../../stores/fileStore";

const FilePreviewRichBlocks = lazy(() => import("./FilePreviewRichBlocks"));

// Treat these application/* MIME types as text for preview rendering
const TEXT_LIKE_TYPES = new Set<string>([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/sql",
  "application/x-httpd-php",
  "application/x-sh",
  "application/x-bat",
]);

// Preview size limits (bytes)
const TEXT_PREVIEW_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BINARY_PREVIEW_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const richPreviewFallback = (
  <div className="flex items-center justify-center p-8">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-zk-border border-t-zk-indigo" />
  </div>
);

function inferPrismLanguage(
  fileName: string,
  contentType: string
): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mapByExt: Record<string, string> = {
    bat: "powershell",
    c: "c",
    conf: "bash",
    cpp: "cpp",
    cs: "csharp",
    css: "css",
    csv: "markup",
    dart: "dart",
    go: "go",
    h: "c",
    hpp: "cpp",
    htm: "markup",
    html: "markup",
    ini: "ini",
    java: "java",
    js: "javascript",
    jsx: "jsx",
    kt: "kotlin",
    less: "less",
    md: "markdown",
    php: "php",
    pl: "perl",
    ps1: "powershell",
    py: "python",
    r: "r",
    rb: "ruby",
    rs: "rust",
    sass: "sass",
    scala: "scala",
    scss: "scss",
    sh: "bash",
    sql: "sql",
    swift: "swift",
    ts: "typescript",
    tsx: "tsx",
    vue: "markup",
    xml: "markup",
    yaml: "yaml",
    yml: "yaml",
  };
  if (mapByExt[ext]) return mapByExt[ext];
  if (contentType.startsWith("text/")) return "markup";
  return null;
}

interface FilePreviewModalProps {
  file: FileMetadata;
  isOpen: boolean;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const { prepareDownloadableFile } = useFileStore();
  const [content, setContent] = useState<null | string>(null);
  const [objectUrl, setObjectUrl] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = await prepareDownloadableFile(file);
        if (!url) {
          throw new Error("Could not prepare file for preview.");
        }

        // For images and PDFs, the URL is enough.
        // For text-based content, we need to fetch the actual text.
        if (
          file.contentType.startsWith("text/") ||
          TEXT_LIKE_TYPES.has(file.contentType)
        ) {
          const response = await fetch(url);
          const textContent = await response.text();
          setContent(textContent);
        } else {
          setContent(url); // For images, PDF, etc.
        }
        setObjectUrl(url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchContent();
  }, [file, isOpen, prepareDownloadableFile]);

  const isSvg =
    file.contentType === "image/svg+xml" ||
    file.fileName.toLowerCase().endsWith(".svg");
  const isHtml =
    file.contentType === "text/html" ||
    file.fileName.toLowerCase().endsWith(".html") ||
    file.fileName.toLowerCase().endsWith(".htm");
  const isTextLike =
    file.contentType.startsWith("text/") ||
    TEXT_LIKE_TYPES.has(file.contentType);
  const exceedsSizeLimit =
    file.size >
    (isTextLike ? TEXT_PREVIEW_MAX_BYTES : BINARY_PREVIEW_MAX_BYTES);

  const openInNewTab = () => {
    if (objectUrl) {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 h-1.5 w-40 overflow-hidden rounded-full bg-zk-border">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
            </div>
            <p className="text-sm text-zk-muted">Loading preview…</p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="max-w-md rounded-xl border border-red-500/35 bg-red-950/20 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15">
              <FileText className="h-6 w-6 text-red-400/95" strokeWidth={1.5} />
            </div>
            <p className="mb-2 font-semibold text-red-300/95">Preview couldn&apos;t load</p>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
        </div>
      );
    }
    if (!content) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zk-border bg-zk-base/50">
              <FileText className="h-6 w-6 text-zk-muted" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-zk-muted">No content to display.</p>
          </div>
        </div>
      );
    }

    if (exceedsSizeLimit) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-zk-muted">
            This file is too large to preview in the app.
          </p>
          <button
            className="rounded-lg border border-zk-indigo/40 bg-zk-indigo/15 px-4 py-2 text-sm font-medium text-zk-text transition-colors hover:bg-zk-indigo/25 disabled:opacity-50"
            onClick={openInNewTab}
            disabled={!objectUrl}
            type="button"
          >
            Open in new tab
          </button>
        </div>
      );
    }

    if (isHtml || isSvg) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <iframe
            className="w-full h-full rounded-lg bg-white"
            referrerPolicy="no-referrer"
            sandbox=""
            src={objectUrl ?? undefined}
            title={file.fileName}
          />
        </div>
      );
    }

    if (file.contentType.startsWith("image/")) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <img
            alt={file.fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            src={content || "/placeholder.svg"}
          />
        </div>
      );
    }
    if (file.contentType === "text/markdown") {
      return (
        <Suspense fallback={richPreviewFallback}>
          <FilePreviewRichBlocks content={content} variant="markdown" />
        </Suspense>
      );
    }
    if (file.contentType === "application/json") {
      return (
        <Suspense fallback={richPreviewFallback}>
          <FilePreviewRichBlocks content={content} variant="json" />
        </Suspense>
      );
    }
    if (
      file.contentType.startsWith("text/") ||
      TEXT_LIKE_TYPES.has(file.contentType)
    ) {
      const lang = inferPrismLanguage(file.fileName, file.contentType);
      if (lang) {
        return (
          <Suspense fallback={richPreviewFallback}>
            <FilePreviewRichBlocks
              content={content}
              language={lang}
              variant="syntax"
            />
          </Suspense>
        );
      }
      return (
        <div className="p-4">
          <pre className="overflow-auto rounded-lg border border-zk-border bg-zk-base/80 p-4 font-zk-mono text-sm leading-relaxed text-zk-text backdrop-blur-sm whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      );
    }
    if (file.contentType === "application/pdf") {
      return (
        <iframe
          className="w-full h-full rounded-lg bg-white"
          src={content}
          title={file.fileName}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zk-border bg-zk-base/50">
            <FileText className="h-6 w-6 text-zk-muted" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-zk-muted">
            Preview isn&apos;t available for this file type.
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="preview-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zk-border bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-zk-border bg-zk-surface/80 p-4 sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
              <FileText className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h2
                className="truncate font-zk-sans text-lg font-semibold text-zk-text"
                id="preview-modal-title"
              >
                {file.fileName}
              </h2>
              <p className="truncate font-zk-sans text-sm text-zk-muted">
                {file.contentType} •{" "}
                {file.size > 1024 * 1024
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${(file.size / 1024).toFixed(2)} KB`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label="Open in new tab"
              className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-base/80 hover:text-zk-text disabled:opacity-50"
              onClick={openInNewTab}
              disabled={!objectUrl}
              title="Open in new tab"
              type="button"
            >
              <ExternalLink className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              aria-label="Close preview"
              className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-base/80 hover:text-zk-text"
              onClick={onClose}
              type="button"
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-zk-base/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default FilePreviewModal;

/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { FileText, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import useFileStore, { type FileMetadata } from "../../stores/fileStore";

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
          file.contentType === "application/json"
        ) {
          const response = await fetch(url);
          const textContent = await response.text();
          setContent(textContent);
        } else {
          setContent(url); // For images, PDF, etc.
        }
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <p className="text-brand-light">Loading preview...</p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center bg-red-900/20 border border-red-500/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-red-400 font-semibold mb-2">Preview Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      );
    }
    if (!content) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-400">No content to display.</p>
          </div>
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
        <div className="prose prose-invert max-w-none p-4 bg-gray-900/50 rounded-lg">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }
    if (file.contentType === "application/json") {
      return (
        <div className="p-4">
          <SyntaxHighlighter
            customStyle={{
              background: "rgba(17, 24, 39, 0.8)",
              border: "1px solid rgba(75, 85, 99, 0.3)",
              borderRadius: "0.75rem",
            }}
            language="json"
            style={atomDark}
          >
            {JSON.stringify(JSON.parse(content), null, 2)}
          </SyntaxHighlighter>
        </div>
      );
    }
    if (file.contentType.startsWith("text/")) {
      return (
        <div className="p-4">
          <pre className="whitespace-pre-wrap bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 text-brand-light font-mono text-sm leading-relaxed overflow-auto">
            {content}
          </pre>
        </div>
      );
    }
    if (file.contentType === "application/pdf") {
      return (
        <embed
          className="w-full h-full rounded-lg"
          src={content}
          title={file.fileName}
          type="application/pdf"
        />
      );
    }

    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-400">
            Preview not available for this file type.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-brand-blue/30 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col backdrop-blur-xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Enhanced Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg font-bold text-brand-light truncate"
                id="preview-modal-title"
              >
                {file.fileName}
              </h2>
              <p className="text-sm text-gray-400">
                {file.contentType} •{" "}
                {file.size > 1024 * 1024
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${(file.size / 1024).toFixed(2)} KB`}
              </p>
            </div>
          </div>
          <button
            aria-label="Close preview"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 flex-shrink-0"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Enhanced Content Area */}
        <main className="overflow-auto flex-1 bg-gradient-to-br from-gray-900/20 to-gray-800/10 backdrop-blur-sm">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default FilePreviewModal;

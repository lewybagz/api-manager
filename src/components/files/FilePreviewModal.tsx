/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Loader2, X } from "lucide-react";
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
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (!content) {
      return <p>No content to display.</p>;
    }

    if (file.contentType.startsWith("image/")) {
      return (
        <img alt={file.fileName} className="max-w-full h-auto" src={content} />
      );
    }
    if (file.contentType === "text/markdown") {
      return (
        <div className="prose prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }
    if (file.contentType === "application/json") {
      return (
        <SyntaxHighlighter language="json" style={atomDark}>
          {JSON.stringify(JSON.parse(content), null, 2)}
        </SyntaxHighlighter>
      );
    }
    if (file.contentType.startsWith("text/")) {
      return <pre className="whitespace-pre-wrap">{content}</pre>;
    }
    if (file.contentType === "application/pdf") {
      return (
        <embed
          className="w-full h-full"
          src={content}
          title={file.fileName}
          type="application/pdf"
        />
      );
    }

    return <p>Preview not available for this file type.</p>;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="preview-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="bg-brand-dark-secondary rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col m-4"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-brand-light truncate">
            {file.fileName}
          </h2>
          <button
            aria-label="Close preview"
            className="p-1 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </header>
        <main className="overflow-auto p-4 flex-1">{renderContent()}</main>
      </div>
    </div>
  );
};

export default FilePreviewModal;

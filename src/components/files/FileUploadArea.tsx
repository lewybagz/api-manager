import { UploadCloud, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import useFileStore from "../../stores/fileStore";

interface FileUploadAreaProps {
  projectId: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ projectId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useFileStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File too large", {
          description: "Maximum file size is 10MB.",
        });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop,
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected", {
        description: "Please select a file to upload.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFileMetadata = await uploadFile(projectId, selectedFile);
      if (uploadedFileMetadata) {
        toast.success("File uploaded successfully", {
          description: `${selectedFile.name} has been uploaded.`,
        });
        setSelectedFile(null); // Clear selection after successful upload
      } else {
        // Error handling is done within the store, but we can show a generic message if null is returned
        toast.error("Upload failed", {
          description: "Could not upload the file. Please try again.",
        });
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="mb-6 p-4 border border-dashed border-gray-600 rounded-lg bg-brand-dark-secondary">
      <div
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-md cursor-pointer text-center transition-colors 
          ${
            isDragActive
              ? "border-brand-blue bg-blue-900/20"
              : "border-gray-500 hover:border-brand-blue"
          }`}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call */}
        <input {...getInputProps()} />
        <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-brand-light">Drop the file here ...</p>
        ) : (
          <p className="text-brand-light-secondary">
            Drag & drop a file here, or click to select file (Max 10MB)
          </p>
        )}
      </div>

      {selectedFile && (
        <div className="mt-4 p-3 bg-gray-700 rounded-md flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-light truncate max-w-xs sm:max-w-sm md:max-w-md">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <div className="flex items-center">
            <button
              className="p-1.5 text-red-400 hover:text-red-300 transition-colors mr-2"
              onClick={handleRemoveFile}
              title="Remove file"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isUploading}
              onClick={() => void handleUpload()}
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;

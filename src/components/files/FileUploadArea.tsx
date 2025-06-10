import { Loader2, UploadCloud } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import useAuthStore from "../../stores/authStore";
import useFileStore from "../../stores/fileStore";
import SensitiveFileWarningModal from "./SensitiveFileWarningModal";

interface FileUploadAreaProps {
  projectId: string;
}

const SENSITIVE_EXTENSIONS = [
  ".env",
  ".pem",
  ".key",
  ".secret",
  ".ovpn",
  ".credential",
  ".cscfg",
  ".rdp",
];

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ projectId }) => {
  const { isLoading, uploadFile } = useFileStore();
  const { masterPasswordSet } = useAuthStore();

  // Default to true if master password is set, otherwise false.
  const [shouldEncrypt, setShouldEncrypt] = useState(masterPasswordSet);

  const [showSensitiveFileModal, setShowSensitiveFileModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<null | string>(
    null
  );
  const [uploadError, setUploadError] = useState<null | string>(null);

  const handleFileUpload = useCallback(
    async (file: File, encrypt: boolean) => {
      setShowSensitiveFileModal(false);
      setPendingFile(null);
      setUploadingFileName(file.name);
      setUploadError(null);
      try {
        await uploadFile(projectId, file, encrypt);
        toast.success(`File "${file.name}" uploaded successfully!`);
        setUploadingFileName(null);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to upload file."
        );
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file."
        );
        setUploadingFileName(null);
      }
    },
    [projectId, uploadFile]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File exceeds 10MB limit.", {
          description: `The file "${file.name}" is too large.`,
        });
        return;
      }

      const isSensitive = SENSITIVE_EXTENSIONS.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (isSensitive) {
        setPendingFile(file);
        setShowSensitiveFileModal(true);
      } else {
        void handleFileUpload(file, shouldEncrypt);
      }
    },
    [handleFileUpload, shouldEncrypt]
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    disabled: isLoading,
    multiple: false,
    onDrop,
  });

  // Effect to sync checkbox state if master password is set/removed after component mounts
  React.useEffect(() => {
    setShouldEncrypt(masterPasswordSet);
  }, [masterPasswordSet]);

  return (
    <>
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-brand-blue bg-blue-900/20"
              : "border-gray-600 hover:border-gray-500"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {isLoading && uploadingFileName ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-brand-blue animate-spin mb-2" />
            <p className="text-brand-blue font-semibold">
              Uploading "{uploadingFileName}"...
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="mx-auto h-12 w-12 text-brand-blue" />
            <p className="mt-2 text-sm text-gray-400">
              {isDragActive ? (
                "Drop the file here ..."
              ) : (
                <span>
                  Drag & drop a file, or{" "}
                  <span className="text-brand-blue font-bold">
                    click to select
                  </span>
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">Max file size: 10MB</p>
          </>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-red-500">{uploadError}</p>
        )}
      </div>
      <div className="mt-4 flex items-center">
        <input
          checked={shouldEncrypt}
          className="h-4 w-4 rounded border-gray-500 bg-brand-dark text-brand-blue focus:ring-brand-blue disabled:opacity-50"
          disabled={!masterPasswordSet}
          id="encrypt-checkbox"
          onChange={(e) => {
            setShouldEncrypt(e.target.checked);
          }}
          type="checkbox"
        />
        <label
          className="ml-2 block text-sm text-brand-light-secondary"
          htmlFor="encrypt-checkbox"
        >
          Encrypt file with master password
        </label>
      </div>
      {!masterPasswordSet && (
        <p className="text-xs text-yellow-500 mt-1">
          Set a master password to enable client-side encryption.
        </p>
      )}

      {pendingFile && (
        <SensitiveFileWarningModal
          fileName={pendingFile.name}
          isOpen={showSensitiveFileModal}
          isSessionLocked={!masterPasswordSet}
          onCancel={() => {
            setPendingFile(null);
            setShowSensitiveFileModal(false);
          }}
          onConfirmEncrypt={() => {
            void handleFileUpload(pendingFile, true);
          }}
          onConfirmUploadWithoutEncryption={() => {
            void handleFileUpload(pendingFile, false);
          }}
        />
      )}
    </>
  );
};

export default FileUploadArea;

import { Lock, Shield, UploadCloud } from "lucide-react";
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
    <div className="space-y-6 max-h-fit">
      {/* Enhanced Upload Area */}
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
          ${
            isDragActive
              ? "border-brand-blue bg-gradient-to-br from-blue-900/30 to-blue-800/20 shadow-lg shadow-brand-blue/20"
              : "border-gray-600/50 hover:border-brand-blue/50 bg-gradient-to-br from-gray-800/20 to-gray-900/10"
          }
          ${
            isLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:shadow-xl hover:shadow-brand-blue/10"
          }`}
      >
        <input {...getInputProps()} />
        {isLoading && uploadingFileName ? (
          <div className="space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <div>
              <p className="text-brand-blue text-lg mb-2">Uploading File</p>
              <p className="text-brand-light font-medium">
                "{uploadingFileName}"
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {shouldEncrypt ? "Encrypting and uploading..." : "Uploading..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-primary rounded-full flex items-center justify-center mx-auto shadow-lg">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-brand-light mb-2">
                {isDragActive ? (
                  "Drop the file here"
                ) : (
                  <span>
                    Drag & drop a file, or{" "}
                    <span className="text-brand-blue hover:text-brand-blue-hover transition-colors duration-200">
                      click to select
                    </span>
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
            </div>
          </div>
        )}
        {uploadError && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Enhanced Encryption Option */}
      <div className="bg-gradient-to-r from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              checked={shouldEncrypt}
              className="h-5 w-5 rounded border-gray-500 bg-brand-dark text-brand-blue focus:ring-brand-blue focus:ring-2 disabled:opacity-50 transition-all duration-200"
              disabled={!masterPasswordSet}
              id="encrypt-checkbox"
              onChange={(e) => {
                setShouldEncrypt(e.target.checked);
              }}
              type="checkbox"
            />
          </div>
          <div className="flex-1">
            <label
              className="flex items-center space-x-2 text-sm font-medium text-brand-light cursor-pointer"
              htmlFor="encrypt-checkbox"
            >
              <Lock className="h-4 w-4 text-brand-blue" />
              <span>Encrypt file with master password</span>
              {shouldEncrypt && (
                <div className="flex items-center justify-center pointer-events-none">
                  <Shield className="h-5 w-5 text-white fill-brand-blue" />
                </div>
              )}
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Files are encrypted client-side before upload for maximum security
            </p>
          </div>
        </div>

        {!masterPasswordSet && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                Set a master password to enable client-side encryption for your
                files.
              </p>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default FileUploadArea;

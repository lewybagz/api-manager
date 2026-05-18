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
    <div className="space-y-6 font-zk-sans max-h-fit">
      {/* Enhanced Upload Area */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-200
          ${
            isDragActive
              ? "border-zk-indigo/60 bg-zk-indigo/10 shadow-[0_0_32px_-12px_rgba(99,102,241,0.35)]"
              : "border-zk-border bg-zk-base/40 hover:border-zk-indigo/35 hover:bg-zk-elevated/30"
          }
          ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        {isLoading && uploadingFileName ? (
          <div className="space-y-4">
            <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-zk-border">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
            </div>
            <div>
              <p className="mb-2 text-lg font-medium text-zk-indigo">Uploading</p>
              <p className="font-medium text-zk-text">&quot;{uploadingFileName}&quot;</p>
              <p className="mt-2 text-sm text-zk-muted">
                {shouldEncrypt ? "Protecting and uploading…" : "Uploading…"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zk-indigo/90 shadow-md">
              <UploadCloud className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="mb-2 text-lg font-semibold text-zk-text">
                {isDragActive ? (
                  "Drop the file here"
                ) : (
                  <span>
                    Drag a file here, or{" "}
                    <span className="font-medium text-zk-indigo transition-colors hover:text-zk-indigo-hover">
                      click to choose
                    </span>
                  </span>
                )}
              </p>
              <p className="text-sm text-zk-muted">Maximum size 10 MB</p>
            </div>
          </div>
        )}
        {uploadError && (
          <div className="mt-4 rounded-lg border border-red-500/35 bg-red-950/25 p-3">
            <p className="text-sm text-red-300/95">{uploadError}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zk-border bg-zk-elevated/40 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              checked={shouldEncrypt}
              className="h-5 w-5 rounded border-zk-border bg-zk-base text-zk-indigo focus:ring-2 focus:ring-zk-indigo/40 disabled:opacity-50"
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
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zk-text"
              htmlFor="encrypt-checkbox"
            >
              <Lock className="h-4 w-4 shrink-0 text-zk-indigo" strokeWidth={1.5} />
              <span>Protect file before upload</span>
              {shouldEncrypt && (
                <div className="pointer-events-none flex items-center justify-center">
                  <Shield className="h-5 w-5 text-zk-cyan/90" strokeWidth={1.5} />
                </div>
              )}
            </label>
            <p className="mt-1 text-xs leading-relaxed text-zk-muted">
              When enabled, the file is protected on your device before it is sent.
            </p>
          </div>
        </div>

        {!masterPasswordSet && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/90" strokeWidth={1.5} />
              <p className="text-xs leading-relaxed text-amber-100/90">
                Set a master password to turn on protection for uploads.
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

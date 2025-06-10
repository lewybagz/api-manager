import { AlertTriangle } from "lucide-react";
import React from "react";

interface SensitiveFileWarningModalProps {
  fileName: string;
  isOpen: boolean;
  isSessionLocked: boolean;
  onCancel: () => void;
  onConfirmEncrypt: () => void;
  onConfirmUploadWithoutEncryption: () => void;
}

const SensitiveFileWarningModal: React.FC<SensitiveFileWarningModalProps> = ({
  fileName,
  isOpen,
  isSessionLocked,
  onCancel,
  onConfirmEncrypt,
  onConfirmUploadWithoutEncryption,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      role="dialog"
    >
      <div className="bg-brand-dark-secondary p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <div className="flex items-center">
          <AlertTriangle className="h-8 w-8 text-yellow-400 mr-3" />
          <h2
            className="text-xl font-semibold text-brand-light"
            id="modal-title"
          >
            Sensitive File Detected
          </h2>
        </div>
        <p className="text-sm text-brand-light-secondary">
          The file{" "}
          <span className="font-bold text-brand-light">{fileName}</span> has an
          extension that suggests it may contain sensitive information.
        </p>
        <p className="text-sm text-brand-light-secondary">
          For your security, we strongly recommend encrypting this file.
        </p>

        {isSessionLocked && (
          <p className="text-xs text-yellow-500 p-2 bg-yellow-900/50 rounded-md">
            Your session is locked. Please unlock it to use the encryption
            feature.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
          <button
            className="px-4 py-2 border border-brand-light-secondary text-brand-light-secondary rounded-md hover:bg-brand-dark focus:outline-none disabled:opacity-50 order-3 sm:order-1"
            onClick={onCancel}
            type="button"
          >
            Cancel Upload
          </button>
          <button
            className="px-4 py-2 border border-yellow-500 text-yellow-500 rounded-md hover:bg-yellow-900/50 focus:outline-none disabled:opacity-50 order-2"
            onClick={onConfirmUploadWithoutEncryption}
            type="button"
          >
            Upload without Encryption
          </button>
          <button
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-md focus:outline-none disabled:opacity-50 order-1"
            disabled={isSessionLocked}
            onClick={onConfirmEncrypt}
            type="submit"
          >
            Encrypt and Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default SensitiveFileWarningModal;

import { AlertTriangle, Lock, Shield } from "lucide-react";
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
    >
      <div className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-yellow-500/30 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-xl">
        <div className="p-6 space-y-6">
          {/* Enhanced Header */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-yellow-400 mb-2"
                id="modal-title"
              >
                Sensitive File Detected
              </h2>
              <p className="text-sm text-brand-light-secondary leading-relaxed">
                The file{" "}
                <span className="font-bold text-brand-light bg-gray-800/50 px-2 py-1 rounded-lg">
                  {fileName}
                </span>{" "}
                has an extension that suggests it may contain sensitive
                information.
              </p>
            </div>
          </div>

          {/* Enhanced Security Message */}
          <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/30 border border-blue-500/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-blue-300">
                Security Recommendation
              </span>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed">
              For your security, we strongly recommend encrypting this file
              before upload.
            </p>
          </div>

          {/* Enhanced Session Lock Warning */}
          {isSessionLocked && (
            <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/30 border border-yellow-500/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-2">
                <Lock className="h-4 w-4 text-yellow-400" />
                <span className="font-semibold text-yellow-300 text-sm">
                  Session Locked
                </span>
              </div>
              <p className="text-xs text-yellow-200 leading-relaxed">
                Your session is locked. Please unlock it to use the encryption
                feature.
              </p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            <button
              className="px-4 py-3 border border-gray-600 text-brand-light-secondary hover:bg-gray-700/50 hover:text-brand-light rounded-xl font-medium transition-all duration-200 order-3 sm:order-1"
              onClick={onCancel}
              type="button"
            >
              Cancel Upload
            </button>
            <button
              className="px-4 py-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 rounded-xl font-medium transition-all duration-200 order-2"
              onClick={onConfirmUploadWithoutEncryption}
              type="button"
            >
              Upload without Encryption
            </button>
            <button
              className="px-4 py-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none order-1"
              disabled={isSessionLocked}
              onClick={onConfirmEncrypt}
              type="submit"
            >
              <span className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Encrypt and Upload</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitiveFileWarningModal;

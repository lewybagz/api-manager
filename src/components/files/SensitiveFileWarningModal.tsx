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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/35 bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="space-y-6 p-6 font-zk-sans">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/90">
              <AlertTriangle className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h2 className="mb-2 text-xl font-semibold text-amber-100/95" id="modal-title">
                Sensitive file
              </h2>
              <p className="text-sm leading-relaxed text-zk-muted">
                The file{" "}
                <span className="rounded-lg border border-zk-border bg-zk-base/60 px-2 py-0.5 font-medium text-zk-text">
                  {fileName}
                </span>{" "}
                may hold private keys or secrets. Choose how you want to upload
                it.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zk-cyan/30 bg-zk-cyan/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 shrink-0 text-zk-cyan" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-zk-cyan">Recommendation</span>
            </div>
            <p className="text-sm leading-relaxed text-zk-muted">
              Prefer uploading with protection on when this type of file is involved.
            </p>
          </div>

          {isSessionLocked && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-amber-200/90" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-amber-100/95">Vault locked</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-200/85">
                Unlock first to turn on protection for this upload.
              </p>
            </div>
          )}

          <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
            <button
              className="order-3 rounded-xl border border-zk-border px-4 py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 hover:text-zk-text sm:order-1"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="order-2 rounded-xl border border-amber-500/40 px-4 py-3 text-sm font-medium text-amber-100/95 transition-colors hover:bg-amber-950/30"
              onClick={onConfirmUploadWithoutEncryption}
              type="button"
            >
              Upload without protection
            </button>
            <button
              className="order-1 rounded-xl bg-zk-indigo px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zk-indigo-hover disabled:opacity-50 sm:order-3"
              disabled={isSessionLocked}
              onClick={onConfirmEncrypt}
              type="button"
            >
              <span className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>Protect and upload</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitiveFileWarningModal;

import React from "react";

interface PwConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PwConfirmDialog: React.FC<PwConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated p-6 font-zk-sans shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-red-400/95">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-zk-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwConfirmDialog;


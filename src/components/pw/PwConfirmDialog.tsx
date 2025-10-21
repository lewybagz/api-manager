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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm pw-card p-4 border border-[color:var(--pw-border)]">
        <h2 className="text-lg font-semibold text-red-200">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-[color:var(--pw-muted)]">
            {description}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="pw-btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="pw-btn-primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwConfirmDialog;


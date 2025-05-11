import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

import { ErrorCategory, logger } from "../../services/logger";
import useAuthStore from "../../stores/authStore";

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState("");
  const { isLoading, masterPasswordSet, setMasterPassword, user } =
    useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subError, setError] = useState<null | string>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      logger.info(ErrorCategory.AUTH, "Attempting to set master password", {
        action: "setMasterPassword",
        userId: user?.uid,
      });

      // Validate master password
      if (!password) {
        setError("Please enter your master password");
        setIsSubmitting(false);
        return;
      }

      // Set master password directly
      await setMasterPassword(password);

      logger.info(ErrorCategory.AUTH, "Master password set successfully", {
        action: "setMasterPassword",
        userId: user?.uid,
      });

      toast.success("Master password set", {
        description: "Your master password has been set successfully",
      });

      // Close the modal
      onClose();
    } catch (error: unknown) {
      console.error("Master password verification error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during verification"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (masterPasswordSet && isOpen) {
      setPassword("");
      onClose();
    }
  }, [masterPasswordSet, onClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />
      <div className="bg-brand-dark-secondary p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold text-brand-light">
          Enter Master Password
        </h2>
        <p className="text-sm text-brand-light-secondary">
          This password is used to encrypt and decrypt your API credentials. It
          is not stored anywhere.
        </p>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <input
            aria-hidden="true"
            autoComplete="username"
            className="sr-only"
            name="username"
            readOnly
            tabIndex={-1}
            type="text"
            value={user?.email ?? ""}
          />
          <div>
            <label
              className="block text-sm font-medium text-brand-light-secondary mb-1"
              htmlFor="masterPassword"
            >
              Master Password:
            </label>
            <input
              aria-label="Master Password"
              autoComplete="current-password"
              className="w-full px-3 py-2 bg-brand-dark border border-brand-dark focus:border-brand-blue rounded-md text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              id="masterPassword"
              name="masterPassword"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              required
              type="password"
              value={password}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              className="px-4 py-2 border border-brand-light-secondary text-brand-light-secondary rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50 order-2 sm:order-1"
              disabled={isLoading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-dark-secondary disabled:opacity-50 order-1 sm:order-2"
              disabled={isLoading || isSubmitting}
              type="submit"
            >
              {isLoading || isSubmitting
                ? "Processing..."
                : "Set Password & Unlock"}
            </button>
          </div>
        </form>
        {subError && <p className="text-sm text-red-400">Error: {subError}</p>}
      </div>
    </div>
  );
};

export default MasterPasswordModal;

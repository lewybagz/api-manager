import React, { useState, useEffect } from "react";
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
  const { setMasterPassword, isLoading, error, masterPasswordSet } =
    useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setMasterPassword(password);
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
      <div className="bg-brand-dark-secondary p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold text-brand-light">
          Enter Master Password
        </h2>
        <p className="text-sm text-brand-light-secondary">
          This password is used to encrypt and decrypt your API credentials. It
          is not stored anywhere.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="masterPassword"
              className="block text-sm font-medium text-brand-light-secondary mb-1"
            >
              Master Password:
            </label>
            <input
              type="password"
              id="masterPassword"
              name="masterPassword"
              autoComplete="current-password"
              aria-label="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 bg-brand-dark border border-brand-dark focus:border-brand-blue rounded-md text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-brand-light-secondary text-brand-light-secondary rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50 order-2 sm:order-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-dark-secondary disabled:opacity-50 order-1 sm:order-2"
            >
              {isLoading ? "Processing..." : "Set Password & Unlock"}
            </button>
          </div>
        </form>
        {error && (
          <p className="text-sm text-red-400">Error: {error.message}</p>
        )}
      </div>
    </div>
  );
};

export default MasterPasswordModal;

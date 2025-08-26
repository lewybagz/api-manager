import { Lock, Unlock } from "lucide-react";
import React from "react";

import useAuthStore from "../../stores/authStore";

const EncryptionStatusIndicator: React.FC = () => {
  const { clearEncryptionKey, encryptionKey, openMasterPasswordModal, user } =
    useAuthStore();

  const isLocked = !encryptionKey;

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  const handleClick = () => {
    // If currently unlocked, lock first, then open modal
    if (!isLocked) {
      clearEncryptionKey();
    }
    // Always open the master password modal on click
    openMasterPasswordModal();
  };

  return (
    <button
      aria-label={isLocked ? "Unlock Session" : "Lock Session"}
      className="p-2 rounded-md hover:bg-brand-dark-tertiary focus:outline-none focus:ring-2 focus:ring-brand-blue"
      onClick={handleClick}
      title={
        isLocked
          ? "Session Locked: Click to Unlock"
          : "Session Unlocked: Click to Lock"
      }
    >
      {isLocked ? (
        <Lock className="h-5 w-5 text-red-500" />
      ) : (
        <Unlock className="h-5 w-5 text-green-500" />
      )}
    </button>
  );
};

export default EncryptionStatusIndicator;

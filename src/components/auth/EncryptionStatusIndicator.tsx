import { Lock, Unlock } from "lucide-react";
import React from "react";

import useAuthStore from "../../stores/authStore";

const EncryptionStatusIndicator: React.FC = () => {
  const {
    clearEncryptionKey,
    encryptionKey,
    masterPasswordSet,
    openMasterPasswordModal,
    user,
  } = useAuthStore();

  const isLocked = !encryptionKey;

  // Don't render if user is not logged in or master password hasn't been set up yet
  if (!user || !masterPasswordSet) {
    return null;
  }

  const handleLock = () => {
    clearEncryptionKey();
    // Optionally, you might want to redirect to a locked screen or show a toast
  };

  const handleUnlock = () => {
    openMasterPasswordModal();
  };

  return (
    <button
      aria-label={isLocked ? "Unlock Session" : "Lock Session"}
      className="p-2 rounded-md hover:bg-brand-dark-tertiary focus:outline-none focus:ring-2 focus:ring-brand-blue"
      onClick={isLocked ? handleUnlock : handleLock}
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

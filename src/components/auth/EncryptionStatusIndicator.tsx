import { Lock, Unlock } from "lucide-react";
import React from "react";

import useAuthStore from "../../stores/authStore";

const EncryptionStatusIndicator: React.FC = () => {
  const { clearEncryptionKey, encryptionKey, openMasterPasswordModal, user } =
    useAuthStore();

  const isLocked = !encryptionKey;

  if (!user) {
    return null;
  }

  const handleClick = () => {
    if (!isLocked) {
      clearEncryptionKey();
    }
    openMasterPasswordModal();
  };

  return (
    <button
      aria-label={isLocked ? "Unlock Session" : "Lock Session"}
      className="rounded-md p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text focus:outline-none focus:ring-2 focus:ring-zk-indigo/45 focus:ring-offset-2 focus:ring-offset-zk-surface"
      onClick={handleClick}
      title={
        isLocked
          ? "Session Locked: Click to Unlock"
          : "Session Unlocked: Click to Lock"
      }
      type="button"
    >
      {isLocked ? (
        <Lock className="h-5 w-5 text-red-400/90" strokeWidth={1.5} />
      ) : (
        <Unlock className="h-5 w-5 text-zk-safe" strokeWidth={1.5} />
      )}
    </button>
  );
};

export default EncryptionStatusIndicator;

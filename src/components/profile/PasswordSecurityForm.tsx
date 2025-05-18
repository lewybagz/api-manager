import {
  EmailAuthProvider,
  type User as FirebaseUser,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import useAuthStore from "../../stores/authStore"; // Adjust path as needed

interface PasswordSecurityFormProps {
  firebaseUser: FirebaseUser | null; // For auth operations
}

const PasswordSecurityForm: React.FC<PasswordSecurityFormProps> = ({
  firebaseUser,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user: authUserHook } = useAuthStore(); // Fallback if prop not available

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    const currentUser = firebaseUser ?? authUserHook;
    if (!currentUser?.email) {
      toast.error(
        "User not authenticated or email is missing. Please re-login."
      );
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email, // Email is now guaranteed by the check above
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to change password. Please try again.";
      if (errorMessage.includes("wrong-password")) {
        toast.error("Incorrect current password", {
          description: "Please verify your current password and try again.",
        });
        setErrors({ currentPassword: "Incorrect password" });
      } else {
        toast.error("Failed to change password", {
          description: errorMessage,
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="bg-brand-dark-secondary p-6 rounded-lg border border-gray-800">
      <form
        onSubmit={(e: React.FormEvent) => {
          void handleChangePassword(e);
        }}
      >
        <div className="space-y-6">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">
              <ShieldAlert className="h-4 w-4 inline-block mr-1 text-yellow-500" />
              Use a strong password and don't reuse it for other accounts.
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-1"
              htmlFor="currentPassword"
            >
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-500" />
              </div>
              <input
                className={`w-full bg-gray-800 text-white pl-10 pr-10 py-2 rounded-md border ${
                  errors.currentPassword ? "border-red-500" : "border-gray-700"
                } focus:outline-none`}
                id="currentPassword"
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                }}
                placeholder="Enter your current password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
              />
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                onClick={() => {
                  setShowCurrentPassword(!showCurrentPassword);
                }}
                tabIndex={-1}
                type="button"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-500 mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-1"
              htmlFor="newPassword"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-500" />
              </div>
              <input
                className={`w-full bg-gray-800 text-white pl-10 pr-10 py-2 rounded-md border ${
                  errors.newPassword ? "border-red-500" : "border-gray-700"
                } focus:outline-none`}
                id="newPassword"
                onChange={(e) => {
                  setNewPassword(e.target.value);
                }}
                placeholder="Enter your new password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
              />
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                onClick={() => {
                  setShowNewPassword(!showNewPassword);
                }}
                tabIndex={-1}
                type="button"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-1"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CheckCircle className="h-5 w-5 text-gray-500" />
              </div>
              <input
                className={`w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-md border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-700"
                } focus:outline-none`}
                id="confirmPassword"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                }}
                placeholder="Confirm your new password"
                type="password"
                value={confirmPassword}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              className="flex items-center justify-center w-full sm:w-auto px-6 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium rounded-md transition-colors"
              disabled={isChangingPassword}
              type="submit"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PasswordSecurityForm;

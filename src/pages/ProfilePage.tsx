import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  AtSign,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Save,
  ShieldAlert,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

import useAuthStore from "../stores/authStore";
import useUserStore from "../stores/userStore";

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { isLoading: userLoading, updateUserDoc, userDoc } = useUserStore();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  useEffect(() => {
    if (userDoc) {
      setDisplayName(userDoc.displayName ?? "");
      setEmail(userDoc.email);
    }
  }, [userDoc]);

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};

    if (!displayName) {
      newErrors.displayName = "Display name is required";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;
    if (!user) return;

    setIsUpdating(true);

    try {
      // If email has changed, update it in Firebase Auth
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      // Update display name in Firebase Auth
      await updateProfile(user, { displayName });

      // Update in Firestore
      await updateUserDoc(user.uid, {
        displayName,
        email,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.";

      if (errorMessage.includes("requires-recent-login")) {
        toast.error("Please re-login before changing your email", {
          description:
            "For security reasons, this action requires a recent login.",
        });
      } else {
        toast.error("Failed to update profile", {
          description: errorMessage,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;
    if (!user) return;

    setIsChangingPassword(true);

    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(
        user.email ?? "",
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

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

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  if (!user || !userDoc) {
    return (
      <div className="text-center p-8 text-brand-light">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-400 mb-4">
          Please log in to access your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
      <Toaster position="top-right" richColors />

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-brand-blue flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-gray-400">
              Manage your account information and password
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === "profile"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => {
              setActiveTab("profile");
            }}
          >
            <UserCog className="h-4 w-4 inline-block mr-2" />
            Profile Information
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === "security"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => {
              setActiveTab("security");
            }}
          >
            <Key className="h-4 w-4 inline-block mr-2" />
            Password & Security
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="bg-brand-dark-secondary p-6 rounded-lg border border-gray-800">
            <form
              onSubmit={(e: React.FormEvent) => {
                void handleUpdateProfile(e);
              }}
            >
              <div className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-300 mb-1"
                    htmlFor="displayName"
                  >
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      className={`w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-md border ${
                        errors.displayName
                          ? "border-red-500"
                          : "border-gray-700"
                      } focus:outline-none focus:ring-1 focus:ring-brand-blue`}
                      id="displayName"
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                      }}
                      placeholder="Enter your display name"
                      type="text"
                      value={displayName}
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.displayName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-300 mb-1"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AtSign className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      className={`w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-md border ${
                        errors.email ? "border-red-500" : "border-gray-700"
                      } focus:outline-none focus:ring-1 focus:ring-brand-blue`}
                      id="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      placeholder="Enter your email address"
                      type="email"
                      value={email}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    className="flex items-center justify-center w-full sm:w-auto px-6 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium rounded-md transition-colors"
                    disabled={isUpdating}
                    type="submit"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === "security" && (
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
                        errors.currentPassword
                          ? "border-red-500"
                          : "border-gray-700"
                      } focus:outline-none focus:ring-1 focus:ring-brand-blue`}
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
                        errors.newPassword
                          ? "border-red-500"
                          : "border-gray-700"
                      } focus:outline-none focus:ring-1 focus:ring-brand-blue`}
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
                    <p className="text-sm text-red-500 mt-1">
                      {errors.newPassword}
                    </p>
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
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-700"
                      } focus:outline-none focus:ring-1 focus:ring-brand-blue`}
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
        )}

        {/* Account Info Card */}
        <div className="mt-8 bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-sm">
          <h3 className="text-gray-300 font-medium mb-2">
            Account Information
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Account Created</span>
              <span className="text-gray-300">
                {new Date(
                  userDoc.createdAt.seconds * 1000
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-gray-300">
                {new Date(
                  userDoc.updatedAt.seconds * 1000
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">User ID</span>
              <span className="text-gray-300 font-mono text-xs bg-gray-700 px-2 py-0.5 rounded">
                {userDoc.uid}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

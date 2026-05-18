import {
  type User as FirebaseUser,
  updateEmail,
  updateProfile,
} from "firebase/auth";
import { AtSign, Loader2, Save, User as UserIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import useAuthStore from "../../stores/authStore"; // Adjust path as needed
import useUserStore from "../../stores/userStore"; // Adjust path as needed

interface ProfileInformationFormProps {
  firebaseUser: FirebaseUser | null;
  initialDisplayName: string;
  initialEmail: string;
  variant?: "default" | "pw";
}

const ProfileInformationForm: React.FC<ProfileInformationFormProps> = ({
  firebaseUser,
  initialDisplayName,
  initialEmail,
  variant = "default",
}) => {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [email, setEmail] = useState(initialEmail);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { updateUserDoc } = useUserStore();
  const { user: authUserHook } = useAuthStore(); // To ensure we use the correct user object from auth store

  useEffect(() => {
    setDisplayName(initialDisplayName);
    setEmail(initialEmail);
  }, [initialDisplayName, initialEmail]);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    const currentUser = firebaseUser ?? authUserHook; // Used nullish coalescing
    if (!currentUser) {
      toast.error("User not authenticated. Please re-login.");
      return;
    }

    setIsUpdating(true);

    try {
      if (email !== currentUser.email) {
        await updateEmail(currentUser, email);
      }
      if (displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName });
      }

      await updateUserDoc(currentUser.uid, {
        displayName,
        email,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
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

  const isPw = variant === "pw";

  return (
    <div
      className={
        isPw
          ? "p-0"
          : "bg-brand-dark-secondary p-6 rounded-lg border border-gray-800"
      }
    >
      <form
        onSubmit={(e: React.FormEvent) => {
          void handleUpdateProfile(e);
        }}
      >
        <div className="space-y-6">
          <div>
            <label
              className={
                isPw
                  ? "block text-xs font-medium text-[color:var(--pw-muted)] mb-1"
                  : "block text-sm font-medium text-gray-300 mb-1"
              }
              htmlFor="displayName"
            >
              Display Name
              <span className=" ml-1 text-(1px) text-gray-400">
                (Not Sure Why)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon
                  className={
                    isPw
                      ? "h-5 w-5 text-[color:var(--pw-muted)]"
                      : "h-5 w-5 text-gray-500"
                  }
                />
              </div>
              <input
                className={
                  isPw
                    ? `pw-input w-full pl-10 pr-3`
                    : `w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-md border ${
                        errors.displayName
                          ? "border-red-500"
                          : "border-gray-700"
                      } focus:outline-none`
                }
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
              <p
                className={
                  isPw
                    ? "text-xs text-red-400 mt-1"
                    : "text-sm text-red-500 mt-1"
                }
              >
                {errors.displayName}
              </p>
            )}
          </div>

          <div>
            <label
              className={
                isPw
                  ? "block text-xs font-medium text-[color:var(--pw-muted)] mb-1"
                  : "block text-sm font-medium text-gray-300 mb-1"
              }
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSign
                  className={
                    isPw
                      ? "h-5 w-5 text-[color:var(--pw-muted)]"
                      : "h-5 w-5 text-gray-500"
                  }
                />
              </div>
              <input
                className={
                  isPw
                    ? `pw-input w-full pl-10 pr-3`
                    : `w-full bg-gray-800 text-white pl-10 pr-3 py-2 rounded-md border ${
                        errors.email ? "border-red-500" : "border-gray-700"
                      } focus:outline-none`
                }
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
              <p
                className={
                  isPw
                    ? "text-xs text-red-400 mt-1"
                    : "text-sm text-red-500 mt-1"
                }
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              className={
                isPw
                  ? "pw-btn-primary flex items-center justify-center w-full sm:w-auto px-6 py-2"
                  : "flex items-center justify-center w-full sm:w-auto px-6 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium rounded-md transition-colors"
              }
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
  );
};

export default ProfileInformationForm;

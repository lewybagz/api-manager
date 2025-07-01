import { ShieldAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Toaster } from "sonner";

import AccountInformationCard from "../components/profile/AccountInformationCard";
import PasswordSecurityForm from "../components/profile/PasswordSecurityForm";
import ProfileInformationForm from "../components/profile/ProfileInformationForm";
import ProfilePageHeader from "../components/profile/ProfilePageHeader";
import ProfilePageTabs from "../components/profile/ProfilePageTabs";
import useAuthStore from "../stores/authStore";
import useUserStore from "../stores/userStore";

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { isLoading: userLoading, userDoc } = useUserStore();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  useEffect(() => {
    // Example: could be used to set document title or other side effects
    // For now, it's here to satisfy the linter if it was removed prematurely.
  }, []);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-brand-light text-lg mb-2">Loading Profile</p>
          <p className="text-sm text-gray-500">Fetching your information...</p>
        </div>
      </div>
    );
  }

  if (!user || !userDoc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="text-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl mb-3 text-red-400">
            Authentication Required
          </h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Please log in to access your profile settings and account
            information.
          </p>
          <a
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            href="/login"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary">
      <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
        <Toaster position="top-right" richColors />

        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-8">
            <ProfilePageHeader />
          </div>

          {/* Enhanced Tabs */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-2 pb-0 border border-gray-800/50">
              <ProfilePageTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="space-y-8">
            {activeTab === "profile" && (
              <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl text-brand-light">
                        Profile Information
                      </h2>
                      <p className="text-sm text-gray-400">
                        Update your account details and preferences
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ProfileInformationForm
                    firebaseUser={user}
                    initialDisplayName={userDoc.displayName ?? ""}
                    initialEmail={userDoc.email}
                  />
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl text-brand-light">
                        Security Settings
                      </h2>
                      <p className="text-sm text-gray-400">
                        Manage your password and security preferences
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <PasswordSecurityForm firebaseUser={user} />
                </div>
              </div>
            )}

            {/* Enhanced Account Information Card */}
            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        clipRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl text-brand-light">
                      Account Information
                    </h2>
                    <p className="text-sm text-gray-400">
                      View your account details and creation date
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0">
                <AccountInformationCard userDoc={userDoc} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

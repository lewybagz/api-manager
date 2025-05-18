import { Loader2, ShieldAlert } from "lucide-react";
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
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 mr-2 text-brand-blue animate-spin" />
        <p className="text-sm text-gray-500">Loading profile...</p>
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
        <ProfilePageHeader />
        <ProfilePageTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "profile" && (
          <ProfileInformationForm
            firebaseUser={user}
            initialDisplayName={userDoc.displayName ?? ""}
            initialEmail={userDoc.email}
          />
        )}

        {activeTab === "security" && (
          <PasswordSecurityForm firebaseUser={user} />
        )}

        <AccountInformationCard userDoc={userDoc} />
      </div>
    </div>
  );
};

export default ProfilePage;

import { Key, UserCog } from "lucide-react";
import React from "react";

interface ProfilePageTabsProps {
  activeTab: "profile" | "security";
  onTabChange: (tab: "profile" | "security") => void;
}

const ProfilePageTabs: React.FC<ProfilePageTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex border-b border-gray-700 mb-6">
      <button
        className={`px-4 py-2 font-medium text-sm border-b-2 ${
          activeTab === "profile"
            ? "border-brand-blue text-brand-blue"
            : "border-transparent text-gray-400 hover:text-gray-300"
        }`}
        onClick={() => {
          onTabChange("profile");
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
          onTabChange("security");
        }}
      >
        <Key className="h-4 w-4 inline-block mr-2" />
        Password & Security
      </button>
    </div>
  );
};

export default ProfilePageTabs;

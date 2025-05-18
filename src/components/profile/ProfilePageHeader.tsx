import { User as UserIcon } from "lucide-react";
import React from "react";

const ProfilePageHeader: React.FC = () => {
  return (
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
  );
};

export default ProfilePageHeader;

import React from "react";

import { type UserDocument } from "../../types/user";

interface AccountInformationCardProps {
  userDoc: null | UserDocument;
}

const AccountInformationCard: React.FC<AccountInformationCardProps> = ({
  userDoc,
}) => {
  if (!userDoc) {
    return (
      <div className="mt-8 bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-sm">
        <h3 className="text-gray-300 font-medium mb-2">Account Information</h3>
        <p className="text-gray-400">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-sm">
      <h3 className="text-gray-300 font-medium mb-2">Account Information</h3>
      <div className="grid grid-cols-1 gap-2">
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Account Created</span>
          <span className="text-gray-300">
            {new Date(userDoc.createdAt.seconds * 1000).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Last Updated</span>
          <span className="text-gray-300">
            {new Date(userDoc.updatedAt.seconds * 1000).toLocaleDateString()}
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
  );
};

export default AccountInformationCard;

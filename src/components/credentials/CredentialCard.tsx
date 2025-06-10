import { cn } from "@/utils/cn";
import {
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  SquarePen,
  Trash2,
} from "lucide-react";
import React from "react";

import { type DecryptedCredential } from "../../stores/credentialStore";

interface CredentialCardProps {
  clipboardTimeoutApiKey: boolean;
  clipboardTimeoutApiSecret: boolean;
  credential: DecryptedCredential;
  isApiKeyCopied: boolean;
  isApiKeyRevealed: boolean;
  isApiSecretCopied: boolean;
  isApiSecretRevealed: boolean;
  isServiceNameCopied: boolean;
  maskCredential: (value: string, revealed: boolean) => string;
  onCopyApiKey: () => void;
  onCopyApiSecret: () => void;
  onCopyServiceName: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleApiKeyReveal: () => void;
  onToggleApiSecretReveal: () => void;
  onUpdateNeeded?: () => void; // Optional, only if credential needs update
}

const CredentialCard: React.FC<CredentialCardProps> = ({
  clipboardTimeoutApiKey,
  clipboardTimeoutApiSecret,
  credential,
  isApiKeyCopied,
  isApiKeyRevealed,
  isApiSecretCopied,
  isApiSecretRevealed,
  isServiceNameCopied,
  maskCredential,
  onCopyApiKey,
  onCopyApiSecret,
  onCopyServiceName,
  onDelete,
  onEdit,
  onToggleApiKeyReveal,
  onToggleApiSecretReveal,
  onUpdateNeeded,
}) => {
  return (
    <div className="relative bg-brand-dark-secondary border border-border border-l-4 border-l-brand-blue border-r-4 border-r-brand-blue rounded-lg shadow-sm p-6 flex flex-col gap-4 min-w-0 w-[85vw] md:w-[25vw] mx-auto transition-shadow hover:shadow-md min-h-[320px] h-full">
      {/* Header: Service Name and Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-y-2 gap-x-2">
        <div className="flex-1 min-w-0 w-full md:w-auto">
          <button
            aria-label="Copy service name to clipboard"
            className="group flex items-center w-full text-left text-brand-blue font-semibold text-lg truncate bg-transparent border-none p-0 m-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:ring-offset-2 rounded-md"
            onClick={onCopyServiceName}
            style={{ WebkitTapHighlightColor: "transparent" }}
            title="Copy service name to clipboard"
          >
            <span className="truncate flex-1 group-hover:text-brand-blue transition-colors">
              {credential.serviceName}
            </span>
            <span className="ml-2 align-middle flex-shrink-0">
              {isServiceNameCopied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400 group-hover:text-brand-blue" />
              )}
            </span>
          </button>
          <div className="text-xs text-gray-400 mt-1">Project Credential</div>
        </div>
        <div className="flex gap-1.5 md:justify-end flex-shrink-0 w-full md:w-auto">
          <button
            className="text-sm text-amber-500 hover:text-amber-400 p-1.5 rounded-md transition-colors"
            onClick={onEdit}
            title="Edit credential"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            className="text-sm text-red-500 hover:text-red-400 p-1.5 rounded-md transition-colors"
            onClick={onDelete}
            title="Delete credential"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {credential.apiKey === "PLACEHOLDER-RESET-VALUE" &&
            onUpdateNeeded && (
              <button
                className="text-xs text-green-500 hover:text-green-400 flex items-center p-1.5 rounded-md transition-colors"
                onClick={onUpdateNeeded}
                title="This credential needs to be updated with correct values"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Update</span>
              </button>
            )}
        </div>
      </div>

      {/* Credential fields */}
      <div className="space-y-3 text-xs sm:text-sm">
        {/* API Key field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-300">API Key</span>
            <div className="flex-shrink-0 flex gap-1.5">
              <button
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isApiKeyCopied || clipboardTimeoutApiKey
                    ? "text-green-500"
                    : "text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                )}
                onClick={onCopyApiKey}
                title="Copy API Key"
              >
                {isApiKeyCopied || clipboardTimeoutApiKey ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isApiKeyRevealed
                    ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                    : "text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                )}
                onClick={onToggleApiKeyReveal}
                title={isApiKeyRevealed ? "Hide API Key" : "Show API Key"}
              >
                {isApiKeyRevealed ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="font-mono p-2 rounded bg-gray-800 text-gray-200 overflow-x-auto whitespace-nowrap text-ellipsis border border-gray-700">
            {maskCredential(credential.apiKey, isApiKeyRevealed)}
          </div>
        </div>

        {/* API Secret field (if exists) */}
        {credential.apiSecret && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-300">API Secret</span>
              <div className="flex-shrink-0 flex gap-1.5">
                <button
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isApiSecretCopied || clipboardTimeoutApiSecret
                      ? "text-green-500"
                      : "text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                  )}
                  onClick={onCopyApiSecret}
                  title="Copy API Secret"
                >
                  {isApiSecretCopied || clipboardTimeoutApiSecret ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isApiSecretRevealed
                      ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      : "text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                  )}
                  onClick={onToggleApiSecretReveal}
                  title={
                    isApiSecretRevealed ? "Hide API Secret" : "Show API Secret"
                  }
                >
                  {isApiSecretRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="font-mono p-2 rounded bg-gray-800 text-gray-200 overflow-x-auto whitespace-nowrap text-ellipsis border border-gray-700">
              {maskCredential(credential.apiSecret, isApiSecretRevealed)}
            </div>
          </div>
        )}

        {/* Notes field (if exists) */}
        {credential.notes && (
          <div>
            <span className="font-medium text-gray-300 block mb-1">Notes</span>
            <div className="p-2 rounded bg-gray-800 text-gray-300 whitespace-pre-wrap break-words border border-gray-700">
              {credential.notes}
            </div>
          </div>
        )}
      </div>

      {/* Timestamp footer */}
      {(credential.createdAt ?? credential.updatedAt) && (
        <div className="mt-2 pt-2 border-t border-gray-700/50 text-[11px] text-gray-500 flex justify-between">
          <span>
            {credential.createdAt &&
              `Created: ${new Date(
                credential.createdAt.seconds * 1000
              ).toLocaleDateString()}`}
          </span>
          <span>
            {credential.updatedAt &&
              credential.updatedAt.seconds !== credential.createdAt?.seconds &&
              `Updated: ${new Date(
                credential.updatedAt.seconds * 1000
              ).toLocaleDateString()}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default CredentialCard;

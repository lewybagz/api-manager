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
    <div className="relative bg-gradient-to-br from-brand-dark-secondary/90 to-brand-dark-secondary/70 backdrop-blur-xl border border-brand-blue/30 border-l-4 border-l-brand-blue border-r-4 border-r-brand-primary rounded-2xl shadow-2xl p-6 flex flex-col gap-4 min-w-0 w-[85vw] md:w-[25vw] mx-auto transition-all duration-300 hover:shadow-2xl hover:shadow-brand-blue/20 hover:border-brand-blue/50 transform hover:scale-105 min-h-[320px] h-full group">
      {/* Enhanced Header: Service Name and Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-y-2 gap-x-2">
        <div className="flex-1 min-w-0 w-full md:w-auto">
          <button
            aria-label="Copy service name to clipboard"
            className="group/btn flex items-center w-full text-left text-brand-blue font-bold text-lg truncate bg-transparent border-none p-0 m-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:ring-offset-2 rounded-lg transition-all duration-200"
            onClick={onCopyServiceName}
            style={{ WebkitTapHighlightColor: "transparent" }}
            title="Copy service name to clipboard"
          >
            <span className="truncate flex-1 group-hover/btn:bg-gradient-to-r group-hover/btn:from-brand-blue group-hover/btn:to-brand-primary group-hover/btn:bg-clip-text group-hover/btn:text-transparent transition-all duration-200">
              {credential.serviceName}
            </span>
            <span className="ml-2 align-middle flex-shrink-0">
              {isServiceNameCopied ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400 group-hover/btn:text-brand-blue transition-colors duration-200" />
              )}
            </span>
          </button>
          <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full"></div>
            <span>Project Credential</span>
          </div>
        </div>
        <div className="flex gap-1.5 md:justify-end flex-shrink-0 w-full md:w-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
            onClick={onEdit}
            title="Edit credential"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
            onClick={onDelete}
            title="Delete credential"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {credential.apiKey === "PLACEHOLDER-RESET-VALUE" &&
            onUpdateNeeded && (
              <button
                className="text-xs text-green-400 hover:text-green-300 hover:bg-green-400/10 flex items-center p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                onClick={onUpdateNeeded}
                title="This credential needs to be updated with correct values"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Update</span>
              </button>
            )}
        </div>
      </div>

      {/* Enhanced Credential fields */}
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Enhanced API Key field */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-brand-blue/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
              <span className="font-semibold text-brand-light">API Key</span>
            </div>
            <div className="flex-shrink-0 flex gap-1.5">
              <button
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 backdrop-blur-sm",
                  isApiKeyCopied || clipboardTimeoutApiKey
                    ? "text-green-400 bg-green-400/10"
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
                  "p-2 rounded-lg transition-all duration-200 backdrop-blur-sm",
                  isApiKeyRevealed
                    ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
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
          <div className="font-mono p-3 rounded-lg bg-gray-900/80 backdrop-blur-sm text-brand-light overflow-x-auto whitespace-nowrap text-ellipsis border border-gray-600/50 hover:border-brand-blue/30 transition-all duration-200">
            {maskCredential(credential.apiKey, isApiKeyRevealed)}
          </div>
        </div>

        {/* Enhanced API Secret field (if exists) */}
        {credential.apiSecret && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-brand-blue/30 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"></div>
                <span className="font-semibold text-brand-light">
                  API Secret
                </span>
              </div>
              <div className="flex-shrink-0 flex gap-1.5">
                <button
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200 backdrop-blur-sm",
                    isApiSecretCopied || clipboardTimeoutApiSecret
                      ? "text-green-400 bg-green-400/10"
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
                    "p-2 rounded-lg transition-all duration-200 backdrop-blur-sm",
                    isApiSecretRevealed
                      ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
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
            <div className="font-mono p-3 rounded-lg bg-gray-900/80 backdrop-blur-sm text-brand-light overflow-x-auto whitespace-nowrap text-ellipsis border border-gray-600/50 hover:border-brand-blue/30 transition-all duration-200">
              {maskCredential(credential.apiSecret, isApiSecretRevealed)}
            </div>
          </div>
        )}

        {/* Enhanced Notes field (if exists) */}
        {credential.notes && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-brand-blue/30 transition-all duration-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
              <span className="font-semibold text-brand-light">Notes</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/80 backdrop-blur-sm text-brand-light-secondary whitespace-pre-wrap break-words border border-gray-600/50 leading-relaxed">
              {credential.notes}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Timestamp footer */}
      {(credential.createdAt ?? credential.updatedAt) && (
        <div className="mt-auto pt-4 border-t border-gray-700/30 text-[11px] text-gray-500 flex justify-between items-center bg-gray-800/20 backdrop-blur-sm rounded-lg p-3 -mx-2">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
            <span>
              {credential.createdAt &&
                `Created: ${new Date(
                  credential.createdAt.seconds * 1000
                ).toLocaleDateString()}`}
            </span>
          </div>
          {credential.updatedAt &&
            credential.updatedAt.seconds !== credential.createdAt?.seconds && (
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full"></div>
                <span>
                  Updated:{" "}
                  {new Date(
                    credential.updatedAt.seconds * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CredentialCard;

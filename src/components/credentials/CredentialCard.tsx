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
    <div
      className="bg-brand-dark-secondary p-4 rounded-lg shadow-lg flex flex-col h-full"
      key={credential.id}
    >
      <div className="flex justify-between items-center mb-2.5">
        <h2 className="w-full text-base sm:text-lg font-semibold text-brand-blue truncate mr-2 pr-2 pb-1 border-b border-white/10">
          <button
            aria-label="Copy service name to clipboard"
            className="group flex items-center w-full text-left text-brand-blue truncate bg-transparent border-none p-0 m-0 focus:outline-none hover:text-white transition-colors"
            onClick={onCopyServiceName}
            style={{ WebkitTapHighlightColor: "transparent" }}
            title="Copy service name to clipboard"
          >
            <span className="truncate flex-1">{credential.serviceName}</span>
            <span className="ml-1.5 align-middle flex-shrink-0">
              {isServiceNameCopied ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 group-hover:text-white text-gray-400" />
              )}
            </span>
          </button>
        </h2>
        <div className="flex space-x-1.5 flex-shrink-0">
          <button
            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors p-1"
            onClick={onEdit}
            title="Edit credential"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            className="text-sm text-red-500 hover:text-red-400 transition-colors p-1"
            onClick={onDelete}
            title="Delete credential"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {credential.apiKey === "PLACEHOLDER-RESET-VALUE" &&
            onUpdateNeeded && (
              <button
                className="text-xs text-green-500 hover:text-green-400 transition-colors flex items-center p-1"
                onClick={onUpdateNeeded}
                title="This credential needs to be updated with correct values"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-0.5" />
                Update
              </button>
            )}
        </div>
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm flex-grow">
        <div>
          <span className="font-medium text-gray-300">API Key:</span>
          <div className="flex items-center justify-between mt-0.5">
            <span
              className={`font-mono p-1.5 rounded bg-gray-800 overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                isApiKeyRevealed ? "text-gray-200" : "text-gray-200"
              } transition-colors duration-300 w-full mr-1.5`}
              title={isApiKeyRevealed ? credential.apiKey : "Masked API Key"}
            >
              {maskCredential(credential.apiKey, isApiKeyRevealed)}
            </span>
            <div className="flex-shrink-0 flex space-x-1.5">
              <button
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                onClick={onCopyApiKey}
                title="Copy API Key"
              >
                {isApiKeyCopied || clipboardTimeoutApiKey ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                onClick={onToggleApiKeyReveal}
                title={isApiKeyRevealed ? "Hide API Key" : "Show API Key"}
              >
                {isApiKeyRevealed ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {credential.apiSecret && (
          <div>
            <span className="font-medium text-gray-300">API Secret:</span>
            <div className="flex items-center justify-between mt-0.5">
              <span
                className={`font-mono p-1.5 rounded bg-gray-800 overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                  isApiSecretRevealed ? "text-gray-200" : "text-gray-200"
                } transition-colors duration-300 w-full mr-1.5`}
                title={
                  isApiSecretRevealed
                    ? credential.apiSecret
                    : "Masked API Secret"
                }
              >
                {maskCredential(credential.apiSecret, isApiSecretRevealed)}
              </span>
              <div className="flex-shrink-0 flex space-x-1.5">
                <button
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  onClick={onCopyApiSecret}
                  title="Copy API Secret"
                >
                  {isApiSecretCopied || clipboardTimeoutApiSecret ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  onClick={onToggleApiSecretReveal}
                  title={
                    isApiSecretRevealed ? "Hide API Secret" : "Show API Secret"
                  }
                >
                  {isApiSecretRevealed ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {credential.notes && (
          <div>
            <span className="font-medium text-gray-300">Notes:</span>
            <p className="mt-0.5 p-1.5 rounded bg-gray-800 text-gray-300 whitespace-pre-wrap break-words">
              {credential.notes}
            </p>
          </div>
        )}
      </div>
      {(credential.createdAt ?? credential.updatedAt) && (
        <div className="mt-3 pt-2 border-t border-gray-700/50 text-2xs text-gray-500 flex justify-between">
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

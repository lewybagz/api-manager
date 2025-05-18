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
      className="bg-brand-dark-secondary p-6 md:p-6 sm:p-4 p-2 rounded-lg shadow-lg flex flex-col h-full"
      key={credential.id} // Key is on the top-level element returned by map in parent
    >
      <div className="flex justify-between items-center mb-3 md:mb-3 sm:mb-2 mb-1">
        <h2 className="w-full text-lg md:text-xl sm:text-lg text-base font-semibold text-brand-blue truncate mr-3 pr-4 pb-2 border-b border-white/20">
          <button
            aria-label="Copy service name to clipboard"
            className="group flex items-center w-full text-left text-brand-blue truncate bg-transparent border-none p-0 m-0 focus:outline-none hover:text-white transition-colors"
            onClick={onCopyServiceName}
            style={{ WebkitTapHighlightColor: "transparent" }}
            title="Copy service name to clipboard"
          >
            <span className="truncate flex-1">{credential.serviceName}</span>
            <span className="ml-2 align-middle flex-shrink-0">
              {isServiceNameCopied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 group-hover:text-white text-gray-400" />
              )}
            </span>
          </button>
        </h2>
        <div className="flex space-x-3 flex-shrink-0">
          <button
            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
            onClick={onEdit}
          >
            <SquarePen className="h-5 w-5" />
          </button>
          <button
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
            onClick={onDelete}
          >
            <Trash2 className="h-5 w-5" />
          </button>
          {credential.apiKey === "PLACEHOLDER-RESET-VALUE" &&
            onUpdateNeeded && (
              <button
                className="text-sm text-green-500 hover:text-green-400 transition-colors flex items-center"
                onClick={onUpdateNeeded}
                title="This credential needs to be updated with correct values"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Update
              </button>
            )}
        </div>
      </div>

      <div className="space-y-3 md:space-y-3 sm:space-y-2 space-y-1 text-sm md:text-base sm:text-sm text-xs flex-grow">
        <div>
          <span className="font-medium text-gray-300">API Key:</span>
          <div className="flex items-center justify-between mt-1 md:mt-1 sm:mt-0.5 mt-0">
            <span
              className={`font-mono p-2 md:p-2 sm:p-1 p-0.5 rounded-md bg-gray-700 overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                isApiKeyRevealed ? "text-gray-200" : "text-gray-200"
              } transition-colors duration-300 w-full mr-2`}
              title={isApiKeyRevealed ? credential.apiKey : ""}
            >
              {maskCredential(credential.apiKey, isApiKeyRevealed)}
            </span>
            <div className="flex-shrink-0 flex space-x-2">
              <button
                className="p-2 text-gray-400 hover:text-white transition-colors"
                onClick={onCopyApiKey}
                title="Copy to clipboard"
              >
                {isApiKeyCopied || clipboardTimeoutApiKey ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                className="p-2 text-gray-400 hover:text-white transition-colors"
                onClick={onToggleApiKeyReveal}
                title={isApiKeyRevealed ? "Hide" : "Show"}
              >
                {isApiKeyRevealed ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {credential.apiSecret && (
          <div>
            <span className="font-medium text-gray-300">API Secret:</span>
            <div className="flex items-center justify-between mt-1 md:mt-1 sm:mt-0.5 mt-0">
              <span
                className={`font-mono p-2 md:p-2 sm:p-1 p-0.5 rounded-md bg-gray-700 overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                  isApiSecretRevealed ? "text-gray-200" : "text-gray-200"
                } transition-colors duration-300 w-full mr-2`}
                title={isApiSecretRevealed ? credential.apiSecret : ""}
              >
                {maskCredential(credential.apiSecret, isApiSecretRevealed)}
              </span>
              <div className="flex-shrink-0 flex space-x-2">
                <button
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  onClick={onCopyApiSecret}
                  title="Copy to clipboard"
                >
                  {isApiSecretCopied || clipboardTimeoutApiSecret ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  onClick={onToggleApiSecretReveal}
                  title={isApiSecretRevealed ? "Hide" : "Show"}
                >
                  {isApiSecretRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {credential.notes && (
          <div>
            <span className="font-medium text-gray-300">Notes:</span>
            <p className="mt-1 md:mt-1 sm:mt-0.5 mt-0 p-2 md:p-2 sm:p-1 p-0.5 rounded-md bg-gray-700 text-gray-300 whitespace-pre-wrap break-words">
              {credential.notes}
            </p>
          </div>
        )}
      </div>
      {(credential.createdAt ?? credential.updatedAt) && (
        <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
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

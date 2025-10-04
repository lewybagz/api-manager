import { type Timestamp } from "firebase/firestore";
import {
  BookLock,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  SquarePen,
  Trash2,
} from "lucide-react";
import React from "react";

import { cn } from "@/utils/cn";

import { type DecryptedCredential } from "../../stores/credentialStore";

interface CredentialCardProps {
  anyCredentialHasNote?: boolean;
  className?: string; // Optional, for custom styling
  clipboardTimeoutApiKey: boolean;
  clipboardTimeoutApiSecret: boolean;
  credential: DecryptedCredential;
  credentialHasNote?: boolean;
  credentialHasSecret?: boolean;
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

const formatTimestamp = (ts: null | Timestamp): string => {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleDateString();
  } catch {
    return String(ts);
  }
};

const CredentialCard: React.FC<CredentialCardProps> = ({
  className,
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
  const hasSecret = credential.apiSecret && credential.apiSecret.length > 0;
  const category = (credential.category ?? "none").toLowerCase();

  return (
    <div
      className={cn(
        "relative bg-brand-dark-secondary/60 backdrop-blur-xl transition-all duration-300 hover:shadow-brand-blue/20 hover:border-brand-blue/40 w-full group overflow-visible",
        className
      )}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-2 px-4 gap-0">
        {/* Service Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-10 bg-gradient-to-b from-transparent from-20% via-brand-blue via-50% to-transparent to-80% rounded-full -translate-x-2"></div>
          <div className={cn("min-w-0 flex-shrink-0 max-w-[350px]")}>
            <button
              aria-label="Copy service name to clipboard"
              className="group/btn flex items-center w-full text-left bg-transparent border-none p-0 m-0 focus:outline-none"
              onClick={onCopyServiceName}
              title="Copy service name"
            >
              <div className="relative inline-flex group/service max-w-[300px]">
                <h3 className="text-md text-brand-light transition-colors duration-200 group-hover/btn:text-brand-blue max-w-[300px]">
                  {credential.serviceName.length > 12
                    ? credential.serviceName.slice(0, 16) + "…"
                    : credential.serviceName}
                </h3>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-pre-wrap break-words shadow-2xl opacity-0 group-hover/service:opacity-100 transition-opacity duration-300 pointer-events-none z-[9999]">
                  copy {credential.serviceName} to clipboard
                </div>
              </div>
              <span className="ml-2 flex items-center gap-2">
                {category !== "none" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/60 border border-gray-700/60 text-gray-300 capitalize">
                    {category}
                  </span>
                )}
                {isServiceNameCopied ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500 transition-colors duration-200 group-hover/btn:text-brand-blue" />
                )}
                {credential.notes && (
                  <div className="relative flex items-center group/notes">
                    <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-pre-wrap break-words shadow-2xl opacity-0 group-hover/notes:opacity-100 transition-opacity duration-300 pointer-events-none z-[9999]">
                      {credential.notes}
                    </div>
                  </div>
                )}
                {credential.apiSecret && (
                  <span className="text-brand-blue">
                    <BookLock className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
            </button>
            <p className="relative text-xs text-gray-400 flex items-center gap-1">
              Project Credential
              <span className="text-gray-400">
                Created: {formatTimestamp(credential.createdAt)}
              </span>
            </p>
          </div>
        </div>

        {/* Credentials */}
        <div className="flex-1 flex items-center justify-center gap-2 max-w-[80%]">
          <div
            className={cn(
              "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 font-mono text-xs w-full"
            )}
          >
            {/* API Key */}
            <div className="flex-1 flex items-center bg-gray-800/50 rounded-lg p-2 min-w-0">
              <span className="text-gray-400 mr-2 flex-shrink-0">API Key:</span>
              <span className="text-brand-light truncate flex-1">
                {maskCredential(credential.apiKey, isApiKeyRevealed)}
              </span>
              <div className="flex items-center flex-shrink-0 ml-2">
                <button
                  className={cn(
                    "p-1.5 rounded-md transition-colors duration-200",
                    isApiKeyCopied || clipboardTimeoutApiKey
                      ? "text-green-400"
                      : "text-gray-400 hover:text-brand-blue"
                  )}
                  onClick={onCopyApiKey}
                  title="Copy API Key"
                >
                  {isApiKeyCopied || clipboardTimeoutApiKey ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  className={cn(
                    "p-1.5 rounded-md transition-colors duration-200",
                    isApiKeyRevealed
                      ? "text-amber-400"
                      : "text-gray-400 hover:text-brand-blue"
                  )}
                  onClick={onToggleApiKeyReveal}
                  title={isApiKeyRevealed ? "Hide" : "Show"}
                >
                  {isApiKeyRevealed ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* API Secret */}
            {hasSecret && (
              <div className="flex-1 flex items-center bg-gray-800/50 rounded-lg p-2 min-w-0">
                <span className="text-gray-400 mr-2 flex-shrink-0">
                  API Secret:
                </span>
                <span className="text-brand-light truncate flex-1">
                  {credential.apiSecret &&
                    maskCredential(credential.apiSecret, isApiSecretRevealed)}
                </span>
                <div className="flex items-center flex-shrink-0 ml-2">
                  <button
                    className={cn(
                      "p-1.5 rounded-md transition-colors duration-200",
                      isApiSecretCopied || clipboardTimeoutApiSecret
                        ? "text-green-400"
                        : "text-gray-400 hover:text-brand-blue"
                    )}
                    onClick={onCopyApiSecret}
                    title="Copy API Secret"
                  >
                    {isApiSecretCopied || clipboardTimeoutApiSecret ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    className={cn(
                      "p-1.5 rounded-md transition-colors duration-200",
                      isApiSecretRevealed
                        ? "text-amber-400"
                        : "text-gray-400 hover:text-brand-blue"
                    )}
                    onClick={onToggleApiSecretReveal}
                    title={isApiSecretRevealed ? "Hide" : "Show"}
                  >
                    {isApiSecretRevealed ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col md:flex-row items-center gap-1.5 self-start md:self-center">
            {credential.apiKey === "PLACEHOLDER-RESET-VALUE" &&
            onUpdateNeeded ? (
              <button
                className="text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 flex items-center p-2 rounded-lg transition-all duration-200 text-xs"
                onClick={onUpdateNeeded}
                title="This credential needs to be updated"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Update</span>
              </button>
            ) : (
              <button
                className="text-amber-400 hover:text-amber-300 p-2 rounded-lg transition-colors duration-200 hover:bg-amber-400/10"
                onClick={onEdit}
                title="Edit credential"
              >
                <SquarePen className="h-4 w-4" />
              </button>
            )}

            <button
              className="text-red-400 hover:text-red-300 p-2 rounded-lg transition-colors duration-200 hover:bg-red-400/10"
              onClick={onDelete}
              title="Delete credential"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialCard;

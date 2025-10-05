import { Plus, Shield } from "lucide-react";
import React from "react";

import { type DecryptedCredential } from "../../stores/credentialStore";
import CredentialCard from "./CredentialCard";

interface CredentialsViewProps {
  clipboardTimeout: Record<string, NodeJS.Timeout>;
  copiedStates: Record<string, boolean>;
  credentials: DecryptedCredential[];
  error: Error | null;
  isLoading: boolean;
  maskCredential: (value: string, revealed: boolean) => string;
  onCopy: (text: string, id: string) => void;
  onDeleteCredential: (credential: DecryptedCredential) => void;
  onEditCredential: (credential: DecryptedCredential) => void;
  onToggleReveal: (fieldId: string) => void;
  onUpdateCategory?: (
    credential: DecryptedCredential,
    newCategory: string
  ) => void;
  revealedStates: Record<string, boolean>;
}

const CredentialsView: React.FC<CredentialsViewProps> = ({
  clipboardTimeout,
  copiedStates,
  credentials,
  error,
  isLoading,
  maskCredential,
  onCopy,
  onDeleteCredential,
  onEditCredential,
  onToggleReveal,
  onUpdateCategory,
  revealedStates,
}) => {
  const sortedCredentials = [...credentials].sort(
    (a, b) =>
      (b.apiSecret && b.apiSecret.length > 0 ? 1 : 0) -
      (a.apiSecret && a.apiSecret.length > 0 ? 1 : 0)
  );

  const showEmptyState = !isLoading && !error && sortedCredentials.length === 0;
  const showCredentials = sortedCredentials.length > 0;

  if (isLoading) {
    return (
      <div className="text-center p-12 text-brand-light flex flex-col items-center gap-4 bg-transparent border-none">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Loading Credentials</p>
          <p className="text-sm text-gray-400">
            Decrypting your secure data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {error && (
        <div className="bg-transparent border-none">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl text-red-400 mb-2">
                Error Loading Credentials
              </h3>
              <p className="text-red-300 leading-relaxed">
                {error.message}. Some credentials may not be displayed or may be
                corrupted.
              </p>
            </div>
          </div>
        </div>
      )}

      {showEmptyState && (
        <div className="text-center py-16 bg-transparent border-none">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-3xl text-brand-light mb-4">No Credentials Yet</h2>
          <p className="text-brand-light-secondary mb-8 max-w-md mx-auto leading-relaxed">
            Click "Add Credential" to secure your first API key for this
            project. Your credentials will be encrypted and stored safely.
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-blue/20 to-brand-primary/20 border border-brand-blue/30 text-brand-blue rounded-xl">
            <Shield className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              Zero-knowledge encryption enabled
            </span>
          </div>
        </div>
      )}

      {showCredentials && (
        <div className="space-y-8 overflow-visible">
          <div className="flex flex-col gap-0 bg-transparent border-none rounded-lg overflow-visible">
            {credentials.map((cred, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === credentials.length - 1;
              let rounded = "";
              if (isFirst && isLast) {
                rounded = "rounded-t-2xl rounded-b-2xl";
              } else if (isFirst) {
                rounded = "rounded-t-2xl";
              } else if (isLast) {
                rounded = "rounded-b-2xl";
              }
              return (
                <CredentialCard
                  className={rounded}
                  clipboardTimeoutApiKey={
                    !!clipboardTimeout[`${cred.id}-apikey`]
                  }
                  clipboardTimeoutApiSecret={
                    !!clipboardTimeout[`${cred.id}-apisecret`]
                  }
                  credential={cred}
                  credentialHasNote={!!cred.notes}
                  credentialHasSecret={
                    !!cred.apiSecret && cred.apiSecret.length > 0
                  }
                  isApiKeyCopied={copiedStates[`${cred.id}-apikey`] ?? false}
                  isApiKeyRevealed={
                    revealedStates[`${cred.id}-apikey`] ?? false
                  }
                  isApiSecretCopied={
                    copiedStates[`${cred.id}-apisecret`] ?? false
                  }
                  isApiSecretRevealed={
                    revealedStates[`${cred.id}-apisecret`] ?? false
                  }
                  isServiceNameCopied={copiedStates[cred.id] ?? false}
                  key={cred.id}
                  maskCredential={maskCredential}
                  onChangeCategory={(newCategory: string) => {
                    onUpdateCategory?.(cred, newCategory);
                  }}
                  onCopyApiKey={() => {
                    onCopy(cred.apiKey, `${cred.id}-apikey`);
                  }}
                  onCopyApiSecret={() => {
                    if (cred.apiSecret) {
                      onCopy(cred.apiSecret, `${cred.id}-apisecret`);
                    }
                  }}
                  onCopyServiceName={() => {
                    onCopy(cred.serviceName, cred.id);
                  }}
                  onDelete={() => {
                    onDeleteCredential(cred);
                  }}
                  onEdit={() => {
                    onEditCredential(cred);
                  }}
                  onToggleApiKeyReveal={() => {
                    onToggleReveal(`${cred.id}-apikey`);
                  }}
                  onToggleApiSecretReveal={() => {
                    onToggleReveal(`${cred.id}-apisecret`);
                  }}
                  onUpdateNeeded={
                    cred.apiKey === "PLACEHOLDER-RESET-VALUE"
                      ? () => {
                          onEditCredential(cred);
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>

          {error && error.message.toLowerCase().includes("decrypt") && (
            <div className="bg-transparent border-none">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl text-red-400 mb-2">
                    Decryption Issue Detected
                  </h3>
                  <p className="text-red-300 mb-4 leading-relaxed">
                    Some credentials could not be decrypted. This might be due
                    to a change in master password or data corruption. If you
                    see a credential marked for update, please edit it with the
                    correct values.
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    Check credentials marked with "Update" button
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CredentialsView;

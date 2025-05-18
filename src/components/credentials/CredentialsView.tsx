import { Loader2 } from "lucide-react"; // Only Loader2 is directly used here
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
  revealedStates,
}) => {
  const showEmptyState = !isLoading && !error && credentials.length === 0;
  const showCredentials = credentials.length > 0;

  if (isLoading) {
    // This specific loading state might be better handled in ProjectDetailPage if it covers the whole view
    // Or if this is for a refresh within the view, it's fine here.
    // For now, keeping a simple loader if credentials specifically are loading.
    return (
      <div className="text-center p-8 text-brand-light flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        <p className="text-sm text-gray-400">Loading credentials...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        // This specific error is for credentials failing to load/decrypt at a high level
        // The part about individual corrupted credentials will be handled below within the map
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-xl font-semibold text-red-400 mb-3">
            Error Loading Credentials
          </h3>
          <p className="text-red-300">
            {error.message}. Some credentials may not be displayed or may be
            corrupted.
          </p>
        </div>
      )}
      {showEmptyState && (
        <div className="text-center p-8 bg-brand-dark-secondary rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-brand-light mb-4">
            No Credentials Yet
          </h2>
          <p className="text-brand-light-secondary mb-6">
            Click "Add Credential" to secure your first API key for this
            project.
          </p>
        </div>
      )}
      {showCredentials && (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-6 sm:gap-4 gap-2">
          {credentials.map((cred) => (
            <CredentialCard
              clipboardTimeoutApiKey={!!clipboardTimeout[`${cred.id}-apikey`]}
              clipboardTimeoutApiSecret={
                !!clipboardTimeout[`${cred.id}-apisecret`]
              }
              credential={cred}
              isApiKeyCopied={copiedStates[`${cred.id}-apikey`] ?? false}
              isApiKeyRevealed={revealedStates[`${cred.id}-apikey`] ?? false}
              isApiSecretCopied={copiedStates[`${cred.id}-apisecret`] ?? false}
              isApiSecretRevealed={
                revealedStates[`${cred.id}-apisecret`] ?? false
              }
              isServiceNameCopied={copiedStates[cred.id] ?? false}
              key={cred.id}
              maskCredential={maskCredential}
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
                    } // Use onEdit for the update action
                  : undefined
              }
            />
          ))}

          {error && error.message.toLowerCase().includes("decrypt") && (
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg shadow-lg col-span-1 md:col-span-2 xl:grid-cols-3 mt-6">
              <h3 className="text-xl font-semibold text-red-400 mb-3">
                Decryption Issue Detected
              </h3>
              <p className="text-red-300 mb-4">
                Some credentials could not be decrypted. This might be due to a
                change in master password or data corruption. If you see a
                credential marked for update, please edit it with the correct
                values.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CredentialsView;

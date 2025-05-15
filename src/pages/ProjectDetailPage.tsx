/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  SquarePen,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast, Toaster } from "sonner";

import CredentialModal from "../components/credentials/CredentialModal";
import useAuthStore from "../stores/authStore";
import useCredentialStore, {
  type DecryptedCredential,
} from "../stores/credentialStore";
import useProjectStore from "../stores/projectStore";

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isLoading: projectsLoading, projects } = useProjectStore();
  const {
    credentials,
    deleteCredential,
    error: credentialsError,
    fetchCredentials,
    isLoading: credentialsLoading,
  } = useCredentialStore();
  const { encryptionKey, masterPasswordSet } = useAuthStore();

  const [project, setProject] = useState<
    null | ReturnType<typeof useProjectStore.getState>["projects"][0]
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<DecryptedCredential | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [revealedStates, setRevealedStates] = useState<Record<string, boolean>>(
    {}
  );
  const [clipboardTimeout, setClipboardTimeout] = useState<
    Record<string, NodeJS.Timeout>
  >({});
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [credentialToDeleteDetails, setCredentialToDeleteDetails] =
    useState<null | {
      id: string;
      serviceName: string;
    }>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle missing projectId
  useEffect(() => {
    if (!projectId) {
      console.error("Project ID is missing from URL params.");
      void navigate("/dashboard");
    }
  }, [navigate, projectId]);

  const loadCredentials = useCallback(() => {
    if (masterPasswordSet && encryptionKey && projectId) {
      void fetchCredentials(projectId).catch((error: unknown) => {
        console.error("Failed to load credentials:", error);
        toast.error("Failed to load credentials", {
          description: "Please try refreshing the page",
        });
      });
    }
  }, [projectId, masterPasswordSet, encryptionKey, fetchCredentials]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    const currentProject = projects.find((p) => p.id === projectId);
    if (currentProject) {
      setProject(currentProject);
    }
  }, [projectId, projects]);

  const handleAddCredential = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const handleEditCredential = useCallback(
    (credential: DecryptedCredential) => {
      setEditingCredential(credential);
      setIsModalOpen(true);
    },
    []
  );

  const handleEditCredentialClick = useCallback(
    (cred: DecryptedCredential) => {
      handleEditCredential(cred);
    },
    [handleEditCredential]
  );

  const confirmAndDeleteCredentialOnDetailPage = async (
    credentialId: string
  ) => {
    if (!projectId) {
      toast.error("Project ID is missing. Cannot delete credential.");
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCredential(credentialId, projectId);
      toast.success("Credential deleted", {
        description: credentialToDeleteDetails
          ? `"${credentialToDeleteDetails.serviceName}" has been deleted`
          : "Credential has been deleted",
      });
    } catch (error: unknown) {
      console.error("Failed to delete credential:", error);
      toast.error("Failed to delete credential", {
        description: "Please try again later",
      });
    } finally {
      setIsDeleting(false);
      closeCredentialDeleteConfirmModal();
    }
  };

  const openCredentialDeleteConfirmModal = (
    credential: DecryptedCredential
  ) => {
    setCredentialToDeleteDetails({
      id: credential.id,
      serviceName: credential.serviceName,
    });
    setShowDeleteConfirmModal(true);
  };

  const closeCredentialDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setCredentialToDeleteDetails(null);
  };

  const executeCredentialDeletion = async () => {
    if (credentialToDeleteDetails) {
      await confirmAndDeleteCredentialOnDetailPage(
        credentialToDeleteDetails.id
      );
    }
  };

  const closeModal = (success?: boolean, action?: "add" | "edit") => {
    setIsModalOpen(false);
    setEditingCredential(null);

    if (success && action) {
      const message =
        action === "add"
          ? "New credential has been added successfully"
          : "Credential has been updated successfully";
      const title =
        action === "add" ? "Credential added" : "Credential updated";
      toast.success(title, {
        description: message,
      });
    } else if (success === false) {
      toast.error("Failed to save credential", {
        description: "Please check your input and try again",
      });
    }

    // Refresh credentials
    if (masterPasswordSet && encryptionKey && projectId) {
      void fetchCredentials(projectId).catch((error: unknown) => {
        console.error("Failed to refresh credentials:", error);
        toast.error("Failed to refresh credentials", {
          description: "Please try refreshing the page",
        });
      });
    }
  };

  const copyToClipboard = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        // Clear any existing timeout
        clearTimeout(clipboardTimeout[id]);
        // Set new timeout to clear the copied state
        const timeout = setTimeout(() => {
          setClipboardTimeout((prev) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...rest } = prev;
            return rest;
          });
          setCopiedStates((prev) => ({ ...prev, [id]: false }));
        }, 2000);
        setClipboardTimeout((prev) => ({ ...prev, [id]: timeout }));
        setCopiedStates((prev) => ({ ...prev, [id]: true }));
        toast.success("Copied to clipboard", {
          description:
            "The unencrypted credential has been copied to your clipboard",
        });
      } catch (error: unknown) {
        console.error("Failed to copy to clipboard:", error);
        toast.error("Failed to copy", {
          description: "Please try copying again",
        });
      }
    },
    [clipboardTimeout]
  );

  const handleCopyToClipboard = useCallback(
    (text: string, id: string) => {
      copyToClipboard(text, id).catch((error: unknown) => {
        console.error("Failed to copy to clipboard:", error);
        toast.error("Failed to copy", {
          description: "Please try copying again",
        });
      });
    },
    [copyToClipboard]
  );

  const maskCredential = (credential: string, revealed: boolean) => {
    if (revealed) return credential;
    if (credential.length <= 4) return "••••";
    return "••••••••••••" + credential.slice(-4);
  };

  const toggleReveal = (fieldId: string) => {
    setRevealedStates((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleNavigateToDashboard = useCallback(() => {
    void navigate("/dashboard");
  }, [navigate]);

  const showEmptyState =
    !credentialsLoading && !credentialsError && credentials.length === 0;
  const showCredentials = credentials.length > 0;

  // Add handler for resetting corrupted credentials
  const handleResetCredential = async (credentialId: string) => {
    if (!projectId) return;

    if (
      window.confirm(
        "This credential appears to be corrupted. Would you like to reset it to a placeholder value? You'll need to update it with the correct value afterward."
      )
    ) {
      try {
        await useCredentialStore
          .getState()
          .resetCorruptedCredential(credentialId, projectId);
        toast.success("Credential reset", {
          description:
            "The credential has been reset. Please update it with the correct value.",
        });
      } catch (error) {
        console.error("Failed to reset credential:", error);
        toast.error("Failed to reset credential", {
          description: "Please try again later.",
        });
      }
    }
  };

  if (!projectId) {
    return (
      <div className="text-center p-8 text-brand-light">
        Error: Project ID not found. Redirecting...
      </div>
    );
  }

  if (projectsLoading || credentialsLoading) {
    return (
      <div className="text-center p-8 text-brand-light">
        Loading project details...
      </div>
    );
  }

  if (!masterPasswordSet) {
    return (
      <div className="bg-brand-dark-secondary p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-semibold text-brand-light mb-4">
          Master Password Required
        </h2>
        <p className="text-brand-light-secondary mb-6">
          Please enter your master password to view credentials.
        </p>
        <button
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md"
          onClick={handleNavigateToDashboard}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center p-8 text-brand-light">
        <h2 className="text-2xl font-semibold mb-4">Project Not Found</h2>
        <Link className="text-brand-blue hover:underline" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
      <Toaster position="top-right" richColors />

      <div className="mb-8">
        <Link
          className="text-brand-blue hover:underline text-sm mb-2 block flex items-center"
          to="/dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold truncate">{project.projectName}</h1>
          <button
            className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md whitespace-nowrap"
            onClick={handleAddCredential}
          >
            Add Credential
          </button>
        </div>
        {project.createdAt && (
          <p className="text-sm text-gray-400 mt-1">
            Created:{" "}
            {new Date(project.createdAt.seconds * 1000).toLocaleDateString()}
          </p>
        )}
      </div>

      {credentialsError && (
        <p className="text-red-400 mb-4">
          Error loading credentials: {credentialsError.message}
        </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((cred) => (
            <div
              className="bg-brand-dark-secondary p-6 rounded-lg shadow-lg flex flex-col h-full"
              key={cred.id}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="w-full text-lg font-semibold text-brand-blue truncate mr-3 pr-4 pb-2 border-b border-white/20 pointer-events-none">
                  {cred.serviceName}
                </h2>
                <div className="flex space-x-3 flex-shrink-0">
                  <button
                    className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                    onClick={() => {
                      handleEditCredentialClick(cred);
                    }}
                  >
                    <SquarePen className="h-5 w-5" />
                  </button>
                  <button
                    className="text-sm text-red-500 hover:text-red-400 transition-colors"
                    onClick={() => {
                      openCredentialDeleteConfirmModal(cred);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  {cred.apiKey === "PLACEHOLDER-RESET-VALUE" && (
                    <button
                      className="text-sm text-green-500 hover:text-green-400 transition-colors flex items-center"
                      onClick={() => {
                        handleEditCredentialClick(cred);
                      }}
                      title="This credential needs to be updated with correct values"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Update
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm flex-grow">
                <div>
                  <span className="font-medium text-gray-300">API Key:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`font-mono p-2 rounded-md bg-gray-700 overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                        revealedStates[`${cred.id}-apikey`]
                          ? "text-gray-200"
                          : "text-gray-200"
                      } transition-colors duration-300 w-full mr-2`}
                      title={
                        revealedStates[`${cred.id}-apikey`] ? cred.apiKey : ""
                      }
                    >
                      {maskCredential(
                        cred.apiKey,
                        revealedStates[`${cred.id}-apikey`]
                      )}
                    </span>
                    <div className="flex-shrink-0 flex space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        onClick={() => {
                          handleCopyToClipboard(
                            cred.apiKey,
                            `${cred.id}-apikey`
                          );
                        }}
                        title="Copy to clipboard"
                      >
                        {clipboardTimeout[`${cred.id}-apikey`] ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        onClick={() => {
                          toggleReveal(`${cred.id}-apikey`);
                        }}
                        title={
                          revealedStates[`${cred.id}-apikey`] ? "Hide" : "Show"
                        }
                      >
                        {revealedStates[`${cred.id}-apikey`] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {cred.apiSecret && (
                  <div>
                    <span className="font-medium text-gray-300">
                      API Secret:
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`font-mono p-2 rounded-md bg-gray-700 overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                          revealedStates[`${cred.id}-apisecret`]
                            ? "text-gray-200"
                            : "text-gray-200"
                        } transition-colors duration-300 w-full mr-2`}
                        title={
                          revealedStates[`${cred.id}-apisecret`]
                            ? cred.apiSecret
                            : ""
                        }
                      >
                        {maskCredential(
                          cred.apiSecret,
                          revealedStates[`${cred.id}-apisecret`]
                        )}
                      </span>
                      <div className="flex-shrink-0 flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          onClick={() => {
                            if (cred.apiSecret) {
                              handleCopyToClipboard(
                                cred.apiSecret,
                                `${cred.id}-apisecret`
                              );
                            }
                          }}
                          title="Copy to clipboard"
                        >
                          {copiedStates[`${cred.id}-apisecret`] ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : clipboardTimeout[`${cred.id}-apisecret`] ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          onClick={() => {
                            toggleReveal(`${cred.id}-apisecret`);
                          }}
                          title={
                            revealedStates[`${cred.id}-apisecret`]
                              ? "Hide"
                              : "Show"
                          }
                        >
                          {revealedStates[`${cred.id}-apisecret`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {cred.notes && (
                  <div>
                    <span className="font-medium text-gray-300">Notes:</span>
                    <p className="mt-1 p-2 rounded-md bg-gray-700 text-gray-300 whitespace-pre-wrap break-words">
                      {cred.notes}
                    </p>
                  </div>
                )}
              </div>
              {(cred.createdAt ?? cred.updatedAt) && (
                <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
                  <span>
                    {cred.createdAt &&
                      `Created: ${new Date(
                        cred.createdAt.seconds * 1000
                      ).toLocaleDateString()}`}
                  </span>
                  <span>
                    {cred.updatedAt &&
                      cred.updatedAt.seconds !== cred.createdAt?.seconds &&
                      `Updated: ${new Date(
                        cred.updatedAt.seconds * 1000
                      ).toLocaleDateString()}`}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Add a component to show corrupted credentials */}
          {credentialsError && (
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
              <h3 className="text-xl font-semibold text-red-400 mb-3">
                Failed to Decrypt Credentials
              </h3>
              <p className="text-red-300 mb-4">
                Some credentials cannot be decrypted with your current master
                password. This could be because they were encrypted with a
                different master password or the data is corrupted.
              </p>
              <div className="flex flex-col space-y-2">
                <div className="bg-red-900/30 p-3 rounded border border-red-500/30 flex items-center justify-between">
                  <span className="text-red-200">ID: UYIK5X3hoWCJ8Ok2sG48</span>
                  <button
                    className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center"
                    onClick={() => {
                      void handleResetCredential("UYIK5X3hoWCJ8Ok2sG48");
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Credential
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CredentialModal
        editingCredential={editingCredential}
        isOpen={isModalOpen}
        onClose={closeModal}
        projectId={projectId}
      />

      {/* Delete Credential Confirmation Modal */}
      {showDeleteConfirmModal && credentialToDeleteDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-brand-dark p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-red-500">
              Confirm Credential Deletion
            </h2>
            <p className="text-brand-light-secondary mb-2">
              Are you sure you want to delete the credential <br />
              <strong className="text-red-400">
                {" '"}
                {credentialToDeleteDetails.serviceName}
                {" '"}
              </strong>
              {` ?`}
            </p>
            <p className="text-sm text-yellow-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-600 text-brand-light-secondary rounded-md hover:bg-gray-700 disabled:opacity-50"
                disabled={isDeleting}
                onClick={closeCredentialDeleteConfirmModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => void executeCredentialDeletion()}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;

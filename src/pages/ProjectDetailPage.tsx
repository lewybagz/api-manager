import React, { useCallback, useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast, Toaster } from "sonner";

import CredentialModal from "../components/credentials/CredentialModal";
import CredentialsView from "../components/credentials/CredentialsView";
import FilesView from "../components/projects/FilesView";
import ProjectHeader from "../components/projects/ProjectHeader";
import ProjectTabs from "../components/projects/ProjectTabs";
import useAuthStore from "../stores/authStore";
import useCredentialStore, {
  type DecryptedCredential,
} from "../stores/credentialStore";
import useProjectStore from "../stores/projectStore";
import useRecentItemsStore from "../stores/recentItemsStore";

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoading: projectsLoading, projects } = useProjectStore();
  const {
    credentials,
    deleteCredential,
    error: credentialsError,
    fetchCredentials,
    isLoading: credentialsLoading,
  } = useCredentialStore();
  const { encryptionKey, masterPasswordSet, openMasterPasswordModal } =
    useAuthStore();
  const { addRecentItem } = useRecentItemsStore();

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
  const [activeTab, setActiveTab] = useState<"credentials" | "files">(
    "credentials"
  );

  useEffect(() => {
    if (!projectId) {
      console.error("Project ID is missing from URL params.");
      void navigate("/dashboard");
    }
  }, [navigate, projectId]);

  useEffect(() => {
    const modalType = searchParams.get("modal");
    const credentialId = searchParams.get("id");

    if (modalType === "credential") {
      if (credentialId) {
        // Find the credential to edit
        const credentialToEdit = credentials.find((c) => c.id === credentialId);
        if (credentialToEdit) {
          setEditingCredential(credentialToEdit);
          setIsModalOpen(true);
        }
      } else {
        // Open modal for new credential
        setEditingCredential(null);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, credentials]);

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
      addRecentItem({
        id: currentProject.id,
        name: currentProject.projectName,
        type: "project",
      });
    }
  }, [projectId, projects, addRecentItem]);

  const handleAddCredential = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const handleEditCredentialClick = useCallback(
    (credential: DecryptedCredential) => {
      setEditingCredential(credential);
      setIsModalOpen(true);
    },
    []
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
        clearTimeout(clipboardTimeout[id]);
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

  const maskCredential = (credentialValue: string, revealed: boolean) => {
    if (revealed) return credentialValue;
    if (credentialValue.length <= 4) return "••••";
    return "••••••••••••" + credentialValue.slice(-4);
  };

  const toggleReveal = (fieldId: string) => {
    setRevealedStates((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleNavigateToDashboard = useCallback(() => {
    void navigate("/dashboard");
  }, [navigate]);

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="text-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30">
          <h2 className="text-2xl text-red-400 mb-4">Project Not Found</h2>
          <p className="text-brand-light mb-6">
            The project ID is missing or invalid. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (
    projectsLoading ||
    (credentialsLoading && credentials.length === 0 && !credentialsError)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-brand-light text-lg mb-2">Loading Project</p>
          <p className="text-sm text-gray-500">Fetching project details...</p>
        </div>
      </div>
    );
  }

  if (!masterPasswordSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 text-center border border-brand-blue/30 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl text-brand-light mb-4">
            Master Password Required
          </h2>
          <p className="text-brand-light-secondary mb-8 leading-relaxed">
            Set your master password to view project details and access your
            encrypted credentials.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              className="w-full bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              onClick={() => {
                openMasterPasswordModal();
              }}
              type="button"
            >
              Set Master Password
            </button>
            <button
              className="w-full border border-brand-light-secondary text-brand-light-secondary hover:bg-brand-dark hover:text-brand-light font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              onClick={handleNavigateToDashboard}
              type="button"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="text-center bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50">
          <h2 className="text-2xl text-brand-light mb-4">Project Not Found</h2>
          <p className="text-gray-400 mb-6">
            The requested project could not be found or you don't have access to
            it.
          </p>
          <Link
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            to="/dashboard"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary">
      <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
        <Toaster position="top-right" richColors />

        {/* Enhanced Project Header */}
        <div className="mb-8">
          <div className="rounded-2xl p-2 bg-brand-dark-secondary/60 backdrop-blur-xl border border-gray-700/50 overflow-hidden">
            <ProjectHeader
              onAddCredential={handleAddCredential}
              projectCreatedAt={project.createdAt}
              projectName={project.projectName}
            />
          </div>
        </div>

        {/* Enhanced Project Tabs */}
        <div className="mb-8">
          <div className="px-4">
            <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="rounded-2xl overflow-visible">
          {activeTab === "credentials" && (
            <CredentialsView
              clipboardTimeout={clipboardTimeout}
              copiedStates={copiedStates}
              credentials={credentials}
              error={credentialsError}
              isLoading={credentialsLoading}
              maskCredential={maskCredential}
              onCopy={handleCopyToClipboard}
              onDeleteCredential={openCredentialDeleteConfirmModal}
              onEditCredential={handleEditCredentialClick}
              onToggleReveal={toggleReveal}
              revealedStates={revealedStates}
            />
          )}

          {activeTab === "files" && projectId && (
            <FilesView projectId={projectId} />
          )}
        </div>

        <CredentialModal
          editingCredential={editingCredential}
          isOpen={isModalOpen}
          onClose={closeModal}
          projectId={projectId}
        />

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirmModal && credentialToDeleteDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                      fillRule="evenodd"
                    />
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM8 13a1 1 0 112 0 1 1 0 01-2 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl mb-4 text-red-400 text-center">
                  Delete Credential
                </h2>
                <p className="text-brand-light-secondary mb-2 text-center">
                  Are you sure you want to delete
                </p>
                <p className="text-center mb-6">
                  <strong className="text-red-400 text-lg">
                    "{credentialToDeleteDetails.serviceName}"
                  </strong>
                </p>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
                  <p className="text-sm text-yellow-400 text-center">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    className="flex-1 px-4 py-3 border border-gray-600 text-brand-light-secondary rounded-xl hover:bg-gray-700/50 disabled:opacity-50 transition-all duration-200"
                    disabled={isDeleting}
                    onClick={closeCredentialDeleteConfirmModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl disabled:opacity-50 transition-all duration-200"
                    disabled={isDeleting}
                    onClick={() => void executeCredentialDeletion()}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;

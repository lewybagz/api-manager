import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  const { encryptionKey, masterPasswordSet, openMasterPasswordModal } =
    useAuthStore();

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
      <div className="text-center p-8 text-brand-light">
        Error: Project ID not found. Redirecting...
      </div>
    );
  }

  if (
    projectsLoading ||
    (credentialsLoading && credentials.length === 0 && !credentialsError)
  ) {
    return (
      <div className="text-center p-8 text-brand-light flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 inline animate-spin text-brand-blue" />
        <p className="text-sm text-gray-500">Loading project details...</p>
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
          Please enter your master password to view project details and
          credentials.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
            onClick={() => {
              openMasterPasswordModal();
            }}
            type="button"
          >
            Set Master Password
          </button>
          <button
            className="border border-brand-light-secondary text-brand-light-secondary hover:bg-brand-dark font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
            onClick={handleNavigateToDashboard}
            type="button"
          >
            Back to Dashboard
          </button>
        </div>
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

      <ProjectHeader
        onAddCredential={handleAddCredential}
        projectCreatedAt={project.createdAt}
        projectName={project.projectName}
      />

      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

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

      <CredentialModal
        editingCredential={editingCredential}
        isOpen={isModalOpen}
        onClose={closeModal}
        projectId={projectId}
      />

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

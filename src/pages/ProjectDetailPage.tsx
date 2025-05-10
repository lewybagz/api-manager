import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Copy, Eye, EyeOff, ArrowLeft } from "lucide-react";
import useProjectStore from "../stores/projectStore";
import useCredentialStore, {
  type DecryptedCredential,
} from "../stores/credentialStore";
import useAuthStore from "../stores/authStore";
import CredentialModal from "../components/credentials/CredentialModal";

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, isLoading: projectsLoading } = useProjectStore();
  const {
    credentials,
    isLoading: credentialsLoading,
    error: credentialsError,
    fetchCredentials,
    deleteCredential,
  } = useCredentialStore();
  const { masterPasswordSet, encryptionKey } = useAuthStore();

  const [project, setProject] = useState<
    ReturnType<typeof useProjectStore.getState>["projects"][0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<DecryptedCredential | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [revealedStates, setRevealedStates] = useState<Record<string, boolean>>(
    {}
  );

  // Early return if projectId is not available from URL params
  if (!projectId) {
    useEffect(() => {
      // Navigate back or to an error page if projectId is missing.
      // This ensures subsequent code relies on a valid projectId.
      console.error("Project ID is missing from URL params.");
      navigate("/dashboard"); // Or a dedicated error page
    }, [navigate]);
    return (
      <div className="text-center p-8 text-brand-light">
        Error: Project ID not found. Redirecting...
      </div>
    );
  }

  const loadCredentials = useCallback(() => {
    // projectId is guaranteed to be a string here
    if (masterPasswordSet && encryptionKey) {
      fetchCredentials(projectId);
    }
  }, [projectId, masterPasswordSet, encryptionKey, fetchCredentials]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    const currentProject = projects.find((p) => p.id === projectId);
    if (currentProject) {
      setProject(currentProject);
    } else if (!projectsLoading && projectId) {
      // If projects are loaded and project not found, maybe navigate back or show error
      // For now, we assume project will be found if ID is valid
    }
  }, [projectId, projects, projectsLoading]);

  const handleAddCredential = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const handleEditCredential = (credential: DecryptedCredential) => {
    setEditingCredential(credential);
    setIsModalOpen(true);
  };

  const handleDeleteCredential = async (credentialId: string) => {
    // projectId is guaranteed to be a string here
    if (window.confirm("Are you sure you want to delete this credential?")) {
      await deleteCredential(credentialId, projectId);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCredential(null);
    // projectId is guaranteed to be a string here
    if (masterPasswordSet && encryptionKey) {
      fetchCredentials(projectId);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedStates((prev) => ({ ...prev, [fieldId]: true }));
        setTimeout(
          () => setCopiedStates((prev) => ({ ...prev, [fieldId]: false })),
          2000
        );
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        // TODO: Show user a copy failed message
      });
  };

  const toggleReveal = (fieldId: string) => {
    setRevealedStates((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  if (projectsLoading || credentialsLoading) {
    return (
      <div className="text-center p-8 text-brand-light">
        Loading project details...
      </div>
    );
  }

  if (!masterPasswordSet) {
    return (
      <div className="text-center p-8 bg-brand-dark-secondary rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-brand-light mb-4">
          Master Password Required
        </h2>
        <p className="text-brand-light-secondary mb-6">
          Please enter your master password to view credentials.
        </p>
        <button
          onClick={() => navigate("/dashboard")} // Or trigger MasterPasswordModal if possible
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md"
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
        <Link to="/dashboard" className="text-brand-blue hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="text-brand-blue hover:underline text-sm mb-2 block flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold truncate">{project.projectName}</h1>
          <button
            onClick={handleAddCredential}
            className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md whitespace-nowrap"
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

      {!credentialsLoading && !credentialsError && credentials.length === 0 && (
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

      {credentials.length > 0 && (
        <div className="space-y-6">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="bg-brand-dark-secondary p-6 rounded-lg shadow-lg"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-brand-blue truncate pr-4">
                  {cred.serviceName}
                </h2>
                <div className="flex space-x-3 flex-shrink-0">
                  <button
                    onClick={() => handleEditCredential(cred)}
                    className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCredential(cred.id)}
                    className="text-sm text-red-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-300">API Key:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`font-mono p-2 rounded-md bg-gray-700 max-w-[26rem] overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                        revealedStates[`${cred.id}-apikey`]
                          ? "text-gray-200"
                          : "text-gray-200"
                      } transition-colors duration-300 w-full mr-2`}
                    >
                      {revealedStates[`${cred.id}-apikey`]
                        ? cred.apiKey
                        : "••••••••••••" + cred.apiKey.slice(-4)}
                    </span>
                    <div>
                      <button
                        onClick={() => toggleReveal(`${cred.id}-apikey`)}
                        className="p-1.5 text-gray-400 hover:text-gray-200"
                      >
                        {revealedStates[`${cred.id}-apikey`] ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(cred.apiKey, `${cred.id}-apikey-copy`)
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-200 relative"
                      >
                        <Copy className="h-5 w-5" />
                        {copiedStates[`${cred.id}-apikey-copy`] && (
                          <span className="absolute -top-6 -right-1 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-md">
                            Copied!
                          </span>
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
                        className={`font-mono p-2 rounded-md bg-gray-700 max-w-[26rem] overflow-x-hidden whitespace-nowrap text-ellipsis block ${
                          revealedStates[`${cred.id}-apisecret`]
                            ? "text-gray-200"
                            : "text-gray-200"
                        } transition-colors duration-300 w-full mr-2`}
                      >
                        {revealedStates[`${cred.id}-apisecret`]
                          ? cred.apiSecret
                          : "••••••••••••" + cred.apiSecret.slice(-4)}
                      </span>
                      <button
                        onClick={() => toggleReveal(`${cred.id}-apisecret`)}
                        className="p-1.5 text-gray-400 hover:text-gray-200"
                      >
                        {revealedStates[`${cred.id}-apisecret`] ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (cred.apiSecret) {
                            copyToClipboard(
                              cred.apiSecret,
                              `${cred.id}-apisecret-copy`
                            );
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-200 relative"
                      >
                        <Copy className="h-5 w-5" />
                        {copiedStates[`${cred.id}-apisecret-copy`] && (
                          <span className="absolute -top-6 -right-1 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-md">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {cred.notes && (
                  <div>
                    <span className="font-medium text-gray-300">Notes:</span>
                    <p className="mt-1 p-2 rounded-md bg-gray-700 text-gray-300 whitespace-pre-wrap break-words w-fit">
                      {cred.notes}
                    </p>
                  </div>
                )}
              </div>
              {(cred.createdAt || cred.updatedAt) && (
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
        </div>
      )}

      {/* projectId is guaranteed to be a string here by the early return */}
      <CredentialModal
        isOpen={isModalOpen}
        onClose={closeModal}
        projectId={projectId}
        editingCredential={editingCredential}
      />
    </div>
  );
};

export default ProjectDetailPage;

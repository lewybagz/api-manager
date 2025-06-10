import { formatDistanceToNow } from "date-fns";
import { FieldValue, Timestamp } from "firebase/firestore";
import {
  Clock,
  FolderEdit,
  FolderPlus,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";

import useAuthStore from "../stores/authStore";
import useCredentialStore from "../stores/credentialStore";
import useFileStore, { type FileMetadata } from "../stores/fileStore";
import useProjectStore, { type Project } from "../stores/projectStore";

interface LastCredentialSummary {
  addedAt: FieldValue | null | Timestamp;
  serviceName: string;
}

const DashboardPage: React.FC = () => {
  const {
    addProject,
    deleteProject,
    error: projectsError,
    fetchProjects,
    isLoading: projectsLoading,
    projects,
    updateProject,
  } = useProjectStore();
  const { masterPasswordSet, openMasterPasswordModal, user } = useAuthStore();
  const {
    credentials,
    fetchAllCredentials,
    isLoading: credentialsLoading,
  } = useCredentialStore();
  const navigate = useNavigate();

  const {
    fetchAllFilesForUser,
    isLoading: filesLoading,
    projectFiles,
  } = useFileStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [editingProject, setEditingProject] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [projectToDeleteDetails, setProjectToDeleteDetails] = useState<null | {
    id: string;
    name: string;
  }>(null);

  const loadProjects = useCallback(() => {
    if (user && masterPasswordSet) {
      void fetchProjects();
    }
  }, [user, masterPasswordSet, fetchProjects]);

  useEffect(() => {
    loadProjects();
    if (user && masterPasswordSet) {
      void fetchAllCredentials();
      void fetchAllFilesForUser();
    }
  }, [
    loadProjects,
    user,
    masterPasswordSet,
    fetchAllCredentials,
    fetchAllFilesForUser,
  ]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const projectId = await addProject({
        projectName: projectName.trim(),
        userId: user.uid,
      });
      setProjectName("");
      setShowAddModal(false);
      toast.success("Project created successfully", {
        description: `"${projectName.trim()}" has been created`,
      });
      if (projectId) {
        void navigate(`/project/${projectId}`);
      }
    } catch (error) {
      console.error("Failed to add project:", error);
      toast.error("Failed to create project", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = (project: Project) => {
    openEditModal({ id: project.id, name: project.projectName });
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!projectToDeleteDetails && project) {
      setProjectToDeleteDetails({ id: project.id, name: project.projectName });
    }

    setIsSubmitting(true);
    try {
      await deleteProject(projectId);
      toast.success("Project deleted", {
        description: projectToDeleteDetails
          ? `"${projectToDeleteDetails.name}" has been deleted`
          : "Project has been deleted",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
      closeDeleteConfirmModal();
    }
  };

  const openDeleteConfirmModal = (project: Project) => {
    setProjectToDeleteDetails({ id: project.id, name: project.projectName });
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setProjectToDeleteDetails(null);
  };

  const executeProjectDeletion = async () => {
    if (projectToDeleteDetails) {
      await handleDeleteProject(projectToDeleteDetails.id);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !projectName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateProject(editingProject.id, {
        projectName: projectName.trim(),
      });
      setEditingProject(null);
      setProjectName("");
      setShowEditModal(false);
      toast.success("Project updated", {
        description: `Project name has been updated to "${projectName.trim()}"`,
      });
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (project: { id: string; name: string }) => {
    setEditingProject(project);
    setProjectName(project.name);
    setShowEditModal(true);
    setShowAddModal(false);
  };

  const openAddModal = () => {
    setProjectName("");
    setEditingProject(null);
    setShowAddModal(true);
    setShowEditModal(false);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setProjectName("");
    setEditingProject(null);
    setIsSubmitting(false);
  };

  if (projectsLoading || credentialsLoading || filesLoading) {
    return (
      <div className="text-center p-8 text-brand-light flex flex-col items-center gap-2">
        <Loader2 className="h-4 w-4 inline animate-spin" />
        <p className="text-sm text-gray-500">Checking Aura Levels...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-brand-light">
        Slow Your Roll Pimp. You're not logged in.
      </p>
    );
  }
  if (!masterPasswordSet) {
    return (
      <div className="text-center p-8 bg-brand-dark-secondary rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-brand-light mb-4">
          Master Password Required
        </h2>
        <p className="text-brand-light-secondary mb-6">
          Please enter your master password to unlock and view your projects.
        </p>
        <button
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
          onClick={() => {
            openMasterPasswordModal();
          }}
          type="button"
        >
          Set Master Password
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
      <Toaster position="top-right" richColors />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Project Dashboard</h1>
        <button
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md"
          onClick={openAddModal}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          className="w-fit pl-10 pr-4 py-2 bg-brand-dark-secondary rounded-lg text-white placeholder-gray-400 focus:outline-none"
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          placeholder="Search projects..."
          type="text"
          value={searchQuery}
        />
      </div>

      {projectsError && (
        <p className="text-red-400">
          Error loading projects: {projectsError.message}
        </p>
      )}

      {projects.length === 0 && (
        <div className="text-center p-8 bg-brand-dark-secondary rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-brand-light mb-4">
            No Projects Yet
          </h2>
          <p className="text-brand-light-secondary mb-6">
            Click "Add New Project" to get started.
          </p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {projects.map((project) => {
            const projectCredentials = credentials.filter(
              (c) => c.projectId === project.id
            );
            const numCredentials = projectCredentials.length;

            const projectSpecificFiles = projectFiles[project.id] ?? [];
            const numFiles = projectSpecificFiles.length;

            let lastCred: LastCredentialSummary | undefined;
            let lastCredentialTimestamp: null | Timestamp = null;

            if (projectCredentials.length > 0) {
              const sortedCredentials = [...projectCredentials].sort(
                (a, b) =>
                  (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
              );
              if (sortedCredentials[0]?.createdAt) {
                lastCred = {
                  addedAt: sortedCredentials[0].createdAt,
                  serviceName: sortedCredentials[0].serviceName,
                };
                lastCredentialTimestamp = sortedCredentials[0].createdAt;
              }
            }

            let lastFile: FileMetadata | undefined;
            let lastFileTimestamp: null | Timestamp = null;
            if (projectSpecificFiles.length > 0) {
              const sortedFiles = [...projectSpecificFiles].sort(
                (a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds
              );
              if (sortedFiles.length > 0) {
                lastFile = sortedFiles[0];
                lastFileTimestamp = sortedFiles[0].uploadedAt;
              }
            }

            let lastAddedItemName: null | string = null;
            let lastAddedItemTimestamp: null | Timestamp = null;
            let itemType: "credential" | "file" | null = null;

            if (lastCredentialTimestamp && lastCred) {
              lastAddedItemName = lastCred.serviceName;
              lastAddedItemTimestamp = lastCredentialTimestamp;
              itemType = "credential";
            }

            if (lastFileTimestamp && lastFile) {
              if (
                !lastAddedItemTimestamp ||
                lastFileTimestamp.seconds > lastAddedItemTimestamp.seconds
              ) {
                lastAddedItemName = lastFile.fileName;
                lastAddedItemTimestamp = lastFileTimestamp;
                itemType = "file";
              }
            }

            const lastUpdated = project.lastUpdated ?? project.updatedAt;
            return (
              <div
                className="bg-brand-dark-secondary max-w-[15vw] rounded-lg shadow-lg p-4 cursor-pointer group transition-all hover:shadow-2xl focus-within:ring-2 focus-within:ring-brand-blue"
                key={project.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  void navigate(`/project/${project.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    void navigate(`/project/${project.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-brand-light truncate">
                    <FolderPlus className="h-5 w-5 inline-block mr-2 text-brand-blue" />
                    {project.projectName}
                  </h3>
                  <nav
                    aria-label="Project actions"
                    className="flex space-x-2 z-10"
                  >
                    <button
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                    >
                      <FolderEdit className="h-5 w-5" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirmModal(project);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </nav>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold text-brand-blue">
                      {numCredentials}
                    </span>{" "}
                    API {numCredentials === 1 ? "key" : "keys"}
                  </div>
                  <div className="font-white font-bold">
                    <span className="text-gray-400">|</span>
                  </div>

                  <div className="text-sm text-gray-400">
                    <span className="font-semibold text-[#48a324]">
                      {numFiles}
                    </span>{" "}
                    {numFiles === 1 ? "file" : "files"}
                  </div>
                </div>

                <div className="text-sm text-gray-400 flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  Last updated:{" "}
                  {lastUpdated
                    ? formatDistanceToNow(lastUpdated.toDate(), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </div>
                <div className="text-xs text-gray-500">
                  {lastAddedItemTimestamp ? (
                    <>
                      Last added:{" "}
                      <span className="font-semibold text-brand-light">
                        {lastAddedItemName}
                      </span>{" "}
                      {formatDistanceToNow(lastAddedItemTimestamp.toDate(), {
                        addSuffix: true,
                      })}
                      {itemType === "file" && (
                        <span className="text-xs text-gray-400 ml-1">
                          (file)
                        </span>
                      )}
                      {itemType === "credential" && (
                        <span className="text-xs text-gray-400 ml-1">
                          (credential)
                        </span>
                      )}
                    </>
                  ) : (
                    <span>No credentials or files added yet.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-brand-dark p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6">
              {showEditModal && editingProject
                ? "Edit Project"
                : "Add New Project"}
            </h2>
            <form
              onSubmit={(e) => {
                void (showEditModal
                  ? handleEditSubmit(e)
                  : handleAddProject(e));
              }}
            >
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-brand-light-secondary mb-1"
                  htmlFor="projectName"
                >
                  Project Name
                </label>
                <input
                  aria-label="Project Name"
                  autoCapitalize="words"
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-brand-light focus:outline-none"
                  id="projectName"
                  name="projectName"
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const formattedValue = inputValue
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      )
                      .join(" ");
                    setProjectName(formattedValue);
                  }}
                  required
                  type="text"
                  value={projectName}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 border border-gray-600 text-brand-light-secondary rounded-md hover:bg-gray-700 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-md disabled:opacity-50"
                  disabled={isSubmitting || !projectName.trim()}
                  type="submit"
                >
                  {isSubmitting
                    ? "Saving..."
                    : showEditModal
                    ? "Save Changes"
                    : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && projectToDeleteDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-brand-dark p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-red-500">
              Confirm Deletion
            </h2>
            <p className="text-brand-light-secondary mb-2">
              Are you sure you want to delete the project <br />
              <strong className="text-red-400">
                {' "'}
                {projectToDeleteDetails.name}
                {'"'}
              </strong>
              {` ?`}
            </p>
            <p className="text-sm text-yellow-400 mb-6">
              This action will also delete all associated credentials and cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-600 text-brand-light-secondary rounded-md hover:bg-gray-700 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={closeDeleteConfirmModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => void executeProjectDeletion()}
                type="button"
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

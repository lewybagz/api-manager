import { formatDistanceToNow } from "date-fns";
import { FieldValue, Timestamp } from "firebase/firestore";
import {
  Clock,
  FolderEdit,
  FolderPlus,
  Lock,
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
          <p className="text-brand-light text-lg mb-2">Loading Dashboard</p>
          <p className="text-sm text-gray-500">Checking Aura Levels...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-800/50">
          <h2 className="text-2xl text-red-400 mb-4">
            Authentication Required
          </h2>
          <p className="text-brand-light">
            You need to be logged in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!masterPasswordSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-8 text-center border border-brand-blue/30 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl text-brand-light mb-4">
            Master Password Required
          </h2>
          <p className="text-brand-light-secondary mb-8 leading-relaxed">
            Set your master password to unlock and securely access your
            projects.
          </p>
          <button
            className="w-full bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            onClick={() => {
              openMasterPasswordModal();
            }}
            type="button"
          >
            Set Master Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary rounded-2xl">
      <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
        <Toaster position="top-right" richColors />

        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl sm:text-5xl text-gray-100 mb-2">
              Project Dashboard
            </h1>
            <p className="text-lg text-gray-500">
              Manage your API credentials and projects
            </p>
          </div>
          <button
            className="bg-brand-blue hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            onClick={openAddModal}
          >
            <Plus className="h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Enhanced Search */}
        <div className="relative mb-8 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            className="w-full pl-12 pr-4 py-3 bg-brand-dark-secondary/80 backdrop-blur-sm border border-gray-700/50 focus:border-brand-blue/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search projects..."
            type="text"
            value={searchQuery}
          />
        </div>

        {projectsError && (
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <p className="text-red-400">
              Error loading projects: {projectsError.message}
            </p>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderPlus className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl text-brand-light mb-3">No Projects Yet</h2>
            <p className="text-brand-light-secondary mb-8 max-w-md mx-auto leading-relaxed">
              Create your first project to start organizing your API credentials
              securely.
            </p>
            <button
              className="bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              onClick={openAddModal}
            >
              Create First Project
            </button>
          </div>
        )}

        {/* Enhanced Projects Grid */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {projects
              .filter((project) =>
                project.projectName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
              )
              .map((project) => {
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
                    className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:border-brand-blue/30 p-6 cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:shadow-brand-blue/10 transform hover:scale-105"
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
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3 flex-grow min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <FolderPlus className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg text-brand-light truncate group-hover:text-brand-blue transition-colors duration-300">
                          {project.projectName}
                        </h3>
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                        >
                          <FolderEdit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirmModal(project);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg text-brand-blue">
                            {numCredentials}
                          </div>
                          <div className="text-xs text-gray-400">
                            {numCredentials === 1 ? "Key" : "Keys"}
                          </div>
                        </div>
                        <div className="w-px h-8 bg-gray-700"></div>
                        <div className="text-center">
                          <div className="text-lg text-green-400">
                            {numFiles}
                          </div>
                          <div className="text-xs text-gray-400">
                            {numFiles === 1 ? "File" : "Files"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Timestamps */}
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Updated{" "}
                          {lastUpdated
                            ? formatDistanceToNow(lastUpdated.toDate(), {
                                addSuffix: true,
                              })
                            : "N/A"}
                        </span>
                      </div>
                      {lastAddedItemTimestamp && (
                        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                          <div className="font-medium text-brand-light text-xs mb-1">
                            Latest Addition:
                          </div>
                          <div className="text-brand-blue font-semibold truncate">
                            {lastAddedItemName}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs">
                              {formatDistanceToNow(
                                lastAddedItemTimestamp.toDate(),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                itemType === "file"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {itemType}
                            </span>
                          </div>
                        </div>
                      )}
                      {!lastAddedItemTimestamp && (
                        <div className="bg-gray-800/30 rounded-lg p-2 border border-gray-700/30">
                          <span className="text-gray-500 text-xs">
                            No items added yet
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Enhanced Modals */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-brand-blue/30 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center">
                    <FolderPlus className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl text-brand-light">
                    {showEditModal && editingProject
                      ? "Edit Project"
                      : "Create New Project"}
                  </h2>
                </div>
                <form
                  onSubmit={(e) => {
                    void (showEditModal
                      ? handleEditSubmit(e)
                      : handleAddProject(e));
                  }}
                >
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium text-brand-light-secondary mb-2"
                      htmlFor="projectName"
                    >
                      Project Name
                    </label>
                    <input
                      aria-label="Project Name"
                      autoCapitalize="words"
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 focus:border-brand-blue/50 rounded-xl text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
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
                      placeholder="Enter project name"
                      required
                      type="text"
                      value={projectName}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      className="flex-1 px-4 py-3 border border-gray-600 text-brand-light-secondary rounded-xl hover:bg-gray-700/50 disabled:opacity-50 transition-all duration-200"
                      disabled={isSubmitting}
                      onClick={closeModal}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl disabled:opacity-50 transition-all duration-200"
                      disabled={isSubmitting || !projectName.trim()}
                      type="submit"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : showEditModal
                        ? "Save Changes"
                        : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirmModal && projectToDeleteDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl mb-4 text-red-400 text-center">
                  Delete Project
                </h2>
                <p className="text-brand-light-secondary mb-2 text-center">
                  Are you sure you want to delete
                </p>
                <p className="text-center mb-6">
                  <strong className="text-red-400 text-lg">
                    "{projectToDeleteDetails.name}"
                  </strong>
                </p>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
                  <p className="text-sm text-yellow-400 text-center">
                    ⚠️ This will also delete all associated credentials and
                    cannot be undone
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    className="flex-1 px-4 py-3 border border-gray-600 text-brand-light-secondary rounded-xl hover:bg-gray-700/50 disabled:opacity-50 transition-all duration-200"
                    disabled={isSubmitting}
                    onClick={closeDeleteConfirmModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl disabled:opacity-50 transition-all duration-200"
                    disabled={isSubmitting}
                    onClick={() => void executeProjectDeletion()}
                    type="button"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Project"}
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

export default DashboardPage;

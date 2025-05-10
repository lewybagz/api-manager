import React, { useState, useEffect, useCallback } from "react";
import useProjectStore, { type Project } from "../stores/projectStore";
import useAuthStore from "../stores/authStore";
import useCredentialStore from "../stores/credentialStore";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FolderPlus,
  FolderEdit,
  Trash2,
  Clock,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DashboardPage: React.FC = () => {
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
  } = useProjectStore();
  const { user, masterPasswordSet } = useAuthStore();
  const {
    credentials,
    isLoading: credentialsLoading,
    fetchAllCredentials,
  } = useCredentialStore();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadProjects = useCallback(() => {
    if (user && masterPasswordSet) {
      fetchProjects();
    }
  }, [user, masterPasswordSet, fetchProjects]);

  useEffect(() => {
    loadProjects();
    if (user && masterPasswordSet) {
      fetchAllCredentials();
    }
  }, [loadProjects, user, masterPasswordSet, fetchAllCredentials]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await addProject({ userId: user.uid, projectName: projectName.trim() });
      setProjectName("");
      setShowAddModal(false);
      // fetchProjects(); // Re-fetch projects or rely on store to update list
    } catch (error) {
      console.error("Failed to add project:", error);
      // Potentially set an error state to display to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = (project: Project) => {
    openEditModal({ id: project.id, name: project.projectName });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This will also delete all associated credentials."
      )
    ) {
      await deleteProject(projectId);
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
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (project: { id: string; name: string }) => {
    setEditingProject(project);
    setProjectName(project.name);
    setShowEditModal(true);
    setShowAddModal(false); // Ensure add modal is closed
  };

  const openAddModal = () => {
    setProjectName("");
    setEditingProject(null);
    setShowAddModal(true);
    setShowEditModal(false); // Ensure edit modal is closed
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setProjectName("");
    setEditingProject(null);
    setIsSubmitting(false); // Reset submitting state on close
  };

  if (projectsLoading || credentialsLoading) {
    return (
      <p className="text-brand-light">Loading projects and credentials...</p>
    );
  }

  if (!user) {
    return (
      <p className="text-brand-light">Please log in to see your dashboard.</p>
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
        {/* Optionally, add a button/link to trigger the master password modal if it's not automatically shown */}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Project Dashboard</h1>
        <button
          onClick={openAddModal}
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-brand-dark-secondary rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      {projectsError && (
        <p className="text-red-400">
          Error loading projects: {projectsError.message}
        </p>
      )}

      {!projectsLoading && !projectsError && projects.length === 0 && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            // Count credentials for this project
            const projectCredentials = credentials.filter(
              (c) => c.projectId === project.id
            );
            const numCredentials = projectCredentials.length;
            // Last credential summary (fallback to last credential in array if missing)
            let lastCred = project.lastCredentialSummary;
            if (!lastCred && projectCredentials.length > 0) {
              const last = [...projectCredentials].sort(
                (a, b) =>
                  (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
              )[0];
              lastCred = last
                ? { serviceName: last.serviceName, addedAt: last.createdAt }
                : undefined;
            }
            // Last updated
            const lastUpdated = project.lastUpdated || project.updatedAt;
            return (
              <div
                key={project.id}
                className="bg-brand-dark-secondary rounded-lg shadow-lg p-4 cursor-pointer group transition-all hover:shadow-2xl focus-within:ring-2 focus-within:ring-brand-blue"
                tabIndex={0}
                role="button"
                onClick={(e) => {
                  // Prevent navigation if clicking on an action icon
                  if ((e.target as HTMLElement).closest("button")) return;
                  navigate(`/project/${project.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/project/${project.id}`);
                  }
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-brand-light truncate">
                    <FolderPlus className="h-5 w-5 inline-block mr-2 text-brand-blue" />
                    {project.projectName}
                  </h3>
                  <div
                    className="flex space-x-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEditProject(project)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      tabIndex={0}
                    >
                      <FolderEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                      tabIndex={0}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-400 mb-2">
                  <span className="font-semibold text-brand-blue">
                    {numCredentials}
                  </span>{" "}
                  API {numCredentials === 1 ? "key" : "keys"}
                </div>
                <div className="text-sm text-gray-400 flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  Last updated:{" "}
                  {lastUpdated
                    ? formatDistanceToNow(
                        lastUpdated.toDate ? lastUpdated.toDate() : new Date(),
                        { addSuffix: true }
                      )
                    : "N/A"}
                </div>
                <div className="text-xs text-gray-500">
                  {lastCred ? (
                    <>
                      Last added:{" "}
                      <span className="font-semibold text-brand-light">
                        {lastCred.serviceName}
                      </span>{" "}
                      {lastCred.addedAt && lastCred.addedAt.toDate
                        ? formatDistanceToNow(lastCred.addedAt.toDate(), {
                            addSuffix: true,
                          })
                        : ""}
                    </>
                  ) : (
                    <span>No credentials added yet.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modals - Basic structure, can be extracted to a component later */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-brand-dark p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6">
              {showEditModal && editingProject
                ? "Edit Project"
                : "Add New Project"}
            </h2>
            <form
              onSubmit={showEditModal ? handleEditSubmit : handleAddProject}
            >
              <div className="mb-4">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-brand-light-secondary mb-1"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  autoComplete="off"
                  aria-label="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-600 text-brand-light-secondary rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !projectName.trim()}
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-md disabled:opacity-50"
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
    </div>
  );
};

export default DashboardPage;

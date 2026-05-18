import { formatDistanceToNow } from "date-fns";
import { FieldValue, Timestamp } from "firebase/firestore";
import {
  Clock,
  Download,
  FolderEdit,
  FolderPlus,
  Lock,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";

import useAuthStore from "../stores/authStore";
import useCredentialStore from "../stores/credentialStore";
import useFileStore, { type FileMetadata } from "../stores/fileStore";
import useProjectStore, { type Project } from "../stores/projectStore";
import useUserStore from "../stores/userStore";
import GlobalSearchBar from "../components/layout/GlobalSearchBar";
import { trialDaysRemaining } from "../utils/access";
import {
  buildProjectEnvFileContent,
  downloadTextFile,
  projectEnvFilename,
} from "../utils/exportProjectEnv";

interface LastCredentialSummary {
  addedAt: FieldValue | null | Timestamp;
  serviceName: string;
}

const DashboardPage: React.FC = () => {
  type LocalProjectStatus =
    | "active"
    | "archived"
    | "completed"
    | "paused"
    | "planned";
  const isProjectStatus = (value: unknown): value is LocalProjectStatus => {
    return (
      value === "active" ||
      value === "archived" ||
      value === "completed" ||
      value === "paused" ||
      value === "planned"
    );
  };
  const ensureProjectStatus = (value: unknown): LocalProjectStatus =>
    isProjectStatus(value) ? value : "active";

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
  const { fetchUserDoc, userDoc } = useUserStore();

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
  const [projectStatus, setProjectStatus] =
    useState<LocalProjectStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardFilteredProjects, setDashboardFilteredProjects] = useState<
    Project[] | null
  >(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [projectToDeleteDetails, setProjectToDeleteDetails] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [dashboardProjectMenuId, setDashboardProjectMenuId] = useState<
    null | string
  >(null);

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case "active":
        return "border-zk-safe/35 bg-zk-safe/10 text-zk-safe";
      case "archived":
        return "border-zk-border bg-zk-base/60 text-zk-muted";
      case "completed":
        return "border-emerald-500/25 bg-emerald-950/30 text-emerald-300/90";
      case "paused":
        return "border-amber-500/30 bg-amber-950/25 text-amber-200/90";
      case "planned":
        return "border-zk-cyan/25 bg-zk-cyan/10 text-zk-cyan/90";
      default:
        return "border-zk-border bg-zk-base/60 text-zk-muted";
    }
  };

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
      if (user.uid) {
        void fetchUserDoc(user.uid);
      }
    }
  }, [
    loadProjects,
    user,
    masterPasswordSet,
    fetchAllCredentials,
    fetchAllFilesForUser,
    fetchUserDoc,
  ]);

  useEffect(() => {
    if (dashboardProjectMenuId === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = document.querySelector(
        `[data-project-menu-root="${dashboardProjectMenuId}"]`,
      );
      if (el?.contains(e.target as Node)) return;
      setDashboardProjectMenuId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [dashboardProjectMenuId]);

  useEffect(() => {
    if (dashboardProjectMenuId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDashboardProjectMenuId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dashboardProjectMenuId]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const projectId = await addProject({
        projectName: projectName.trim(),
        status: ensureProjectStatus(projectStatus),
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
    } catch (error: unknown) {
      toast.error("Failed to create project", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = (project: Project) => {
    openEditModal({ id: project.id, name: project.projectName });
    setProjectStatus(ensureProjectStatus(project.status ?? "active"));
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
    } catch (error: unknown) {
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
        status: ensureProjectStatus(projectStatus),
      });
      setEditingProject(null);
      setProjectName("");
      setShowEditModal(false);
      toast.success("Project updated", {
        description: `Project name has been updated to "${projectName.trim()}"`,
      });
    } catch (error: unknown) {
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
    setProjectStatus("active");
    setShowEditModal(true);
    setShowAddModal(false);
  };

  const openAddModal = () => {
    setProjectName("");
    setEditingProject(null);
    setProjectStatus("active");
    setShowAddModal(true);
    setShowEditModal(false);
  };

  const projectsForGrid = dashboardFilteredProjects ?? projects;

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setProjectName("");
    setEditingProject(null);
    setIsSubmitting(false);
    setProjectStatus("active");
  };

  const downloadProjectEnvFromDashboard = useCallback(
    (project: Project) => {
      const rows = credentials.filter((c) => c.projectId === project.id);
      if (rows.length === 0) {
        toast.error("Nothing to download yet", {
          description: "Add a credential to this project first.",
        });
        return;
      }
      const content = buildProjectEnvFileContent(rows);
      downloadTextFile(content, projectEnvFilename(project.projectName));
      setDashboardProjectMenuId(null);
      toast.success("Download started", {
        description: "Keep this file somewhere safe and private.",
      });
    },
    [credentials],
  );

  if (projectsLoading || credentialsLoading || filesLoading) {
    return (
      <div className="flex min-h-[100vh] items-center justify-center bg-transparent px-4 font-zk-sans">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-6 h-1 w-44 overflow-hidden rounded-full bg-zk-elevated">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/70" />
          </div>
          <p className="text-base font-medium tracking-[-0.02em] text-zk-text">
            Loading dashboard
          </p>
          <p className="mt-2 text-sm text-zk-muted">
            Syncing projects, credentials, and files…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-transparent p-4 font-zk-sans">
        <div className="max-w-md rounded-2xl border border-zk-border bg-zk-elevated/50 p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-red-400/95">
            Authentication required
          </h2>
          <p className="text-sm leading-relaxed text-zk-muted">
            You need to be logged in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!masterPasswordSet) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-transparent p-4 font-zk-sans">
        <div className="w-full max-w-md rounded-2xl border border-zk-indigo/30 bg-zk-elevated/60 p-8 text-center shadow-[0_0_40px_-16px_rgba(79,70,229,0.25)]">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-zk-indigo/90">
            <Lock className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-zk-text">
            Master password required
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-zk-muted">
            Set your master password to unlock and securely access your
            projects.
          </p>
          <button
            className="w-full rounded-xl bg-zk-indigo py-3.5 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
            onClick={() => {
              openMasterPasswordModal();
            }}
            type="button"
          >
            Set master password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent font-zk-sans text-zk-text">
      <div className="p-4 sm:p-6 lg:p-8">
        <Toaster position="top-right" richColors />

        <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-[-0.04em] text-zk-text sm:text-4xl">
              Project dashboard
            </h1>
            <p className="text-sm text-zk-muted sm:text-base">
              Manage API credentials and projects
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-zk-indigo px-5 py-3 text-sm font-medium text-white shadow-[0_0_24px_-10px_rgba(99,102,241,0.45)] transition-colors hover:bg-zk-indigo-hover"
            onClick={openAddModal}
            type="button"
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
            New project
          </button>
        </div>

        {/* Trial Banner */}
        {(() => {
          const status = userDoc?.billing?.status;
          const isPro = status === "active";
          const daysLeft = trialDaysRemaining(userDoc ?? null);
          const isTrialActive = daysLeft > 0 || status === "trialing";
          if (!isPro && isTrialActive) {
            return (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-950/20 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                  <Clock
                    className="h-4 w-4 text-amber-200/90"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-amber-100/95">
                    Trial active
                    {daysLeft > 0
                      ? ` · ${String(daysLeft)} day${
                          daysLeft === 1 ? "" : "s"
                        } left`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-amber-200/75">
                    Subscribe anytime to keep access when your trial ends.
                  </p>
                </div>
                <Link
                  className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100/95 transition-colors hover:bg-amber-500/20"
                  to="/pro"
                >
                  Subscribe
                </Link>
              </div>
            );
          }
          return null;
        })()}

        <div className="relative mb-8 max-w-2xl w-full">
          <GlobalSearchBar
            className="w-full"
            onFilteredProjectsChange={setDashboardFilteredProjects}
            variant="dashboard"
          />
        </div>

        {projectsError && (
          <div className="mb-6 rounded-xl border border-red-500/35 bg-red-950/25 p-4">
            <p className="text-sm text-red-300/95">
              Error loading projects: {projectsError.message}
            </p>
          </div>
        )}

        {projects.length === 0 && (
          <div className="rounded-2xl border border-zk-border bg-zk-elevated/40 py-16 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-zk-base/80">
              <FolderPlus className="h-7 w-7 text-zk-muted" strokeWidth={1.5} />
            </div>
            <h2 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-zk-text">
              No projects yet
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-zk-muted">
              Create your first project to start organizing your API credentials
              securely.
            </p>
            <button
              className="rounded-xl bg-zk-indigo px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
              onClick={openAddModal}
              type="button"
            >
              Create first project
            </button>
          </div>
        )}

        {projects.length > 0 && projectsForGrid.length === 0 && (
          <div className="mb-6 rounded-xl border border-zk-border bg-zk-elevated/40 px-4 py-3 text-sm text-zk-muted">
            Nothing in your project list matches that search.
          </div>
        )}

        {/* Enhanced Projects Grid */}
        {projectsForGrid.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {projectsForGrid.map((project) => {
              const projectCredentials = credentials.filter(
                (c) => c.projectId === project.id,
              );
              const numCredentials = projectCredentials.length;

              const projectSpecificFiles = projectFiles[project.id] ?? [];
              const numFiles = projectSpecificFiles.length;

              let lastCred: LastCredentialSummary | undefined;
              let lastCredentialTimestamp: null | Timestamp = null;

              if (projectCredentials.length > 0) {
                const sortedCredentials = [...projectCredentials].sort(
                  (a, b) => {
                    const ba = b.createdAt ? b.createdAt.seconds : 0;
                    const aa = a.createdAt ? a.createdAt.seconds : 0;
                    return ba - aa;
                  },
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
                  (a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds,
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
                  className="group cursor-pointer rounded-2xl border border-zk-border bg-zk-elevated/45 p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-zk-indigo/30 hover:shadow-[0_12px_40px_-20px_rgba(79,70,229,0.2)]"
                  key={project.id}
                  onClick={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("button")) return;
                    if (t.closest("[data-project-menu-root]")) return;
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
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90 text-white transition-colors group-hover:bg-zk-indigo">
                        <FolderPlus className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-zk-text transition-colors group-hover:text-zk-text">
                        {project.projectName}
                      </h3>
                    </div>
                    <div className="relative flex shrink-0 items-center">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-zk-mono text-[10px] font-medium uppercase tracking-wide ${getStatusBadgeClasses(
                          project.status ? project.status : "active",
                        )}`}
                      >
                        {project.status ? project.status : "active"}
                      </span>
                      <div
                        className="relative"
                        data-project-menu-root={project.id}
                      >
                        <button
                          aria-expanded={dashboardProjectMenuId === project.id}
                          aria-haspopup="true"
                          aria-label="Project actions"
                          className="rounded-lg py-1.5 text-zk-muted transition-colors hover:bg-zk-base/70 hover:text-zk-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDashboardProjectMenuId((id) =>
                              id === project.id ? null : project.id,
                            );
                          }}
                          type="button"
                        >
                          <MoreVertical className="h-5 w-5" strokeWidth={1.5} />
                        </button>
                        {dashboardProjectMenuId === project.id && (
                          <div
                            className="absolute right-0 top-full z-30 mt-1 min-w-[12.5rem] overflow-hidden rounded-xl border border-zk-border bg-zk-elevated py-1 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.55)]"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            role="menu"
                          >
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zk-text transition-colors hover:bg-zk-base/60 disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={numCredentials === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadProjectEnvFromDashboard(project);
                              }}
                              role="menuitem"
                              type="button"
                            >
                              <Download
                                className="h-4 w-4 shrink-0 text-zk-indigo"
                                strokeWidth={1.5}
                              />
                              Download .env
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zk-text transition-colors hover:bg-zk-base/60"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDashboardProjectMenuId(null);
                                handleEditProject(project);
                              }}
                              role="menuitem"
                              type="button"
                            >
                              <FolderEdit
                                className="h-4 w-4 shrink-0 text-amber-300/90"
                                strokeWidth={1.5}
                              />
                              Edit project
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-300/95 transition-colors hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDashboardProjectMenuId(null);
                                openDeleteConfirmModal(project);
                              }}
                              role="menuitem"
                              type="button"
                            >
                              <Trash2
                                className="h-4 w-4 shrink-0"
                                strokeWidth={1.5}
                              />
                              Delete project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="font-zk-mono text-lg font-medium text-zk-indigo">
                          {numCredentials}
                        </div>
                        <div className="text-xs text-zk-muted">
                          {numCredentials === 1 ? "Key" : "Keys"}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-zk-border" />
                      <div className="text-center">
                        <div className="font-zk-mono text-lg font-medium text-zk-safe">
                          {numFiles}
                        </div>
                        <div className="text-xs text-zk-muted">
                          {numFiles === 1 ? "File" : "Files"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 font-zk-sans text-xs text-zk-muted">
                    <div className="flex items-center gap-2">
                      <Clock
                        className="h-3.5 w-3.5 shrink-0"
                        strokeWidth={1.5}
                      />
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
                      <div className="rounded-lg border border-zk-border bg-zk-base/50 p-2.5">
                        <div className="mb-1 font-zk-mono text-[10px] uppercase tracking-wide text-zk-muted">
                          Latest addition
                        </div>
                        <div className="truncate font-medium text-zk-text">
                          {lastAddedItemName}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span>
                            {formatDistanceToNow(
                              lastAddedItemTimestamp.toDate(),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-zk-mono text-[10px] uppercase tracking-wide ${
                              itemType === "file"
                                ? "border border-zk-safe/30 bg-zk-safe/10 text-zk-safe"
                                : "border border-zk-indigo/30 bg-zk-indigo/10 text-zk-indigo"
                            }`}
                          >
                            {itemType}
                          </span>
                        </div>
                      </div>
                    )}
                    {!lastAddedItemTimestamp && (
                      <div className="rounded-lg border border-zk-border/80 bg-zk-base/40 p-2.5">
                        <span className="text-zk-muted/90">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zk-border bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zk-indigo/90">
                    <FolderPlus
                      className="h-5 w-5 text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-zk-text">
                    {showEditModal && editingProject
                      ? "Edit project"
                      : "Create project"}
                  </h2>
                </div>
                <form
                  onSubmit={(e) => {
                    void (showEditModal
                      ? handleEditSubmit(e)
                      : handleAddProject(e));
                  }}
                >
                  <div className="mb-5">
                    <label
                      className="mb-2 block text-sm font-medium text-zk-muted"
                      htmlFor="projectName"
                    >
                      Project name
                    </label>
                    <input
                      aria-label="Project Name"
                      autoCapitalize="words"
                      autoComplete="off"
                      className="w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-3 font-zk-sans text-sm text-zk-text transition-colors placeholder:text-zk-muted/50 focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30"
                      id="projectName"
                      name="projectName"
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const formattedValue = inputValue
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase(),
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
                  <div className="mb-6">
                    <label
                      className="mb-2 block text-sm font-medium text-zk-muted"
                      htmlFor="projectStatus"
                    >
                      Status
                    </label>
                    <select
                      className="w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-3 font-zk-sans text-sm text-zk-text focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30"
                      id="projectStatus"
                      name="projectStatus"
                      onChange={(e) => {
                        const v = e.target.value;
                        setProjectStatus(ensureProjectStatus(v));
                      }}
                      value={projectStatus}
                    >
                      <option value="active">Active</option>
                      <option value="planned">Planned</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 disabled:opacity-50"
                      disabled={isSubmitting}
                      onClick={closeModal}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 rounded-xl bg-zk-indigo py-3 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover disabled:opacity-50"
                      disabled={isSubmitting || !projectName.trim()}
                      type="submit"
                    >
                      {isSubmitting
                        ? "Saving…"
                        : showEditModal
                          ? "Save changes"
                          : "Create project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirmModal && projectToDeleteDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                  <Trash2 className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>
                <h2 className="mb-3 text-xl font-semibold text-red-400/95">
                  Delete project
                </h2>
                <p className="mb-2 text-sm text-zk-muted">
                  Are you sure you want to delete
                </p>
                <p className="mb-6">
                  <strong className="text-lg text-red-300/95">
                    &quot;{projectToDeleteDetails.name}&quot;
                  </strong>
                </p>
                <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                  <p className="text-center text-sm text-amber-200/85">
                    This will also delete all associated credentials and files.
                    This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={closeDeleteConfirmModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={() => void executeProjectDeletion()}
                    type="button"
                  >
                    {isSubmitting ? "Deleting…" : "Delete project"}
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

import { Lock, Trash2, UploadCloud, X } from "lucide-react";
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
import FileUploadArea from "../components/files/FileUploadArea";
import GlobalSearchBar from "../components/layout/GlobalSearchBar";
import FilesView from "../components/projects/FilesView";
import ProjectHeader from "../components/projects/ProjectHeader";
import ProjectTabs from "../components/projects/ProjectTabs";
import useAuthStore from "../stores/authStore";
import useCredentialStore, {
  type DecryptedCredential,
} from "../stores/credentialStore";
import useProjectStore from "../stores/projectStore";
import useRecentItemsStore from "../stores/recentItemsStore";
import {
  buildProjectEnvFileContent,
  downloadTextFile,
  projectEnvFilename,
} from "../utils/exportProjectEnv";

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
    Record<string, ReturnType<typeof setTimeout>>
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
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // Persist per session and per project: initialize from sessionStorage or URL
  useEffect(() => {
    if (!projectId) return;
    const paramFilter = searchParams.get("category");
    const stored = sessionStorage.getItem(
      `project_${projectId}_categoryFilter`
    );
    const initial = paramFilter ?? stored ?? "all";
    setCategoryFilter(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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

  useEffect(() => {
    if (!projectId) {
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
      void fetchCredentials(projectId).catch(() => {
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

  useEffect(() => {
    if (!fileUploadModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFileUploadModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fileUploadModalOpen]);

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
    } catch {
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
      void fetchCredentials(projectId).catch(() => {
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
            const nextTimeouts = { ...prev };
            delete nextTimeouts[id];
            return nextTimeouts;
          });
          setCopiedStates((prev) => ({ ...prev, [id]: false }));
        }, 2000);
        setClipboardTimeout((prev) => ({ ...prev, [id]: timeout }));
        setCopiedStates((prev) => ({ ...prev, [id]: true }));
        toast.success("Copied to clipboard", {
          description: "Ready to paste where you need it.",
        });
      } catch {
        toast.error("Failed to copy", {
          description: "Please try copying again",
        });
      }
    },
    [clipboardTimeout]
  );

  const handleCopyToClipboard = useCallback(
    (text: string, id: string) => {
      copyToClipboard(text, id).catch(() => {
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

  const handleExportProjectEnv = useCallback(() => {
    if (!project) return;
    if (credentials.length === 0) {
      toast.error("Nothing to download yet", {
        description: "Add a credential to this project first.",
      });
      return;
    }
    const content = buildProjectEnvFileContent(credentials);
    downloadTextFile(content, projectEnvFilename(project.projectName));
    toast.success("Download started", {
      description: "Keep this file somewhere safe and private.",
    });
  }, [credentials, project]);

  if (!projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4 font-zk-sans">
        <div className="max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated/50 p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-red-400/95">
            Project not found
          </h2>
          <p className="text-sm leading-relaxed text-zk-muted">
            The project link looks invalid. Sending you back to your dashboard…
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
      <div className="flex min-h-screen items-center justify-center bg-transparent font-zk-sans">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 h-1.5 w-48 overflow-hidden rounded-full bg-zk-border">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
          </div>
          <p className="mb-2 text-lg font-medium text-zk-text">Loading project</p>
          <p className="text-sm text-zk-muted">Fetching details…</p>
        </div>
      </div>
    );
  }

  if (!masterPasswordSet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4 font-zk-sans">
        <div className="w-full max-w-md rounded-2xl border border-zk-indigo/30 bg-zk-elevated/60 p-8 text-center shadow-[0_0_40px_-16px_rgba(79,70,229,0.25)]">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-zk-indigo/90">
            <Lock className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-zk-text">
            Master password required
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-zk-muted">
            Set your master password to open this project and your saved keys.
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="w-full rounded-xl bg-zk-indigo py-3.5 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
              onClick={() => {
                openMasterPasswordModal();
              }}
              type="button"
            >
              Set master password
            </button>
            <button
              className="w-full rounded-xl border border-zk-border py-3.5 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 hover:text-zk-text"
              onClick={handleNavigateToDashboard}
              type="button"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4 font-zk-sans">
        <div className="max-w-md rounded-2xl border border-zk-border bg-zk-elevated/40 p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-zk-text">
            Project not found
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-zk-muted">
            We couldn&apos;t load this project. It may have been removed or you
            may not have access.
          </p>
          <Link
            className="inline-flex items-center rounded-xl bg-zk-indigo px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
            to="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  // Derive filtered credentials based on categoryFilter and searchQuery
  const filteredCredentials = credentials.filter((credential) => {
    const category = (credential.category ?? "none").toLowerCase();
    const matchesCategory =
      categoryFilter === "all" || category === categoryFilter.toLowerCase();

    if (!matchesCategory) return false;
    if (!normalizedSearchQuery) return true;

    const searchableContent = [
      credential.serviceName,
      credential.apiKey,
      credential.apiSecret ?? "",
      credential.notes ?? "",
      credential.category ?? "none",
      credential.id,
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedSearchQuery);
  });

  const hasCredentialFilters =
    categoryFilter !== "all" || normalizedSearchQuery.length > 0;

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
      <div className="p-4 sm:p-6 lg:p-8">
        <Toaster position="top-right" richColors />

        <div className="relative z-20 mb-8">
          <div className="overflow-visible rounded-2xl border border-zk-border bg-zk-elevated/35 p-1 sm:p-2">
            <ProjectHeader
              canExportEnv={credentials.length > 0}
              categoryFilter={categoryFilter}
              onAddCredential={handleAddCredential}
              onCategoryFilterChange={(value: string) => {
                setCategoryFilter(value);
                if (projectId) {
                  sessionStorage.setItem(
                    `project_${projectId}_categoryFilter`,
                    value
                  );
                }
                const current = new URLSearchParams(searchParams);
                if (value === "all") {
                  current.delete("category");
                } else {
                  current.set("category", value);
                }
                void navigate(
                  { search: current.toString() },
                  { replace: true }
                );
              }}
              onExportEnv={handleExportProjectEnv}
              projectCreatedAt={project.createdAt}
              projectId={project.id}
              projectName={project.projectName}
              status={ensureProjectStatus(project.status)}
            />
          </div>
        </div>

        <div className="mb-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <GlobalSearchBar
              className="w-full"
              onQueryChange={setSearchQuery}
              prioritizeProjectId={project.id}
              variant="page"
            />
          </div>
          {projectId && (
            <button
              aria-label="Upload a file"
              className="group relative flex shrink-0 items-center justify-center gap-2 self-stretch overflow-hidden rounded-xl border border-zk-indigo/35 bg-zk-elevated px-4 py-3 font-zk-sans text-sm font-medium text-zk-text shadow-[0_0_28px_-10px_rgba(99,102,241,0.45)] transition-[border-color,box-shadow,transform,background-color] duration-200 hover:border-zk-indigo/55 hover:bg-zk-indigo/15 hover:shadow-[0_0_36px_-8px_rgba(99,102,241,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zk-base active:scale-[0.98] sm:self-center sm:py-2.5"
              onClick={() => {
                setFileUploadModalOpen(true);
              }}
              type="button"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zk-indigo/25 via-transparent to-zk-cyan/10 opacity-80 transition-opacity duration-200 group-hover:opacity-100"
              />
              <UploadCloud
                className="relative h-5 w-5 shrink-0 text-zk-indigo transition-colors group-hover:text-zk-indigo-hover"
                strokeWidth={1.5}
              />
              <span className="relative hidden sm:inline">Upload</span>
            </button>
          )}
        </div>

        <div className="mb-8">
          <div className="px-0 sm:px-1">
            <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        <div className="overflow-visible rounded-2xl">
          {activeTab === "credentials" && (
            <CredentialsView
              clipboardTimeout={clipboardTimeout}
              copiedStates={copiedStates}
              credentials={filteredCredentials}
              error={credentialsError}
              hasActiveFilters={hasCredentialFilters}
              isLoading={credentialsLoading}
              maskCredential={maskCredential}
              onCopy={handleCopyToClipboard}
              onDeleteCredential={openCredentialDeleteConfirmModal}
              onEditCredential={handleEditCredentialClick}
              onToggleReveal={toggleReveal}
              onUpdateCategory={(credential, newCategory) => {
                if (!projectId) return;
                // Update category quickly
                void useCredentialStore
                  .getState()
                  .updateCredential(credential.id, projectId, {
                    category: newCategory,
                  });
              }}
              revealedStates={revealedStates}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === "files" && projectId && (
            <FilesView projectId={projectId} searchQuery={searchQuery} />
          )}
        </div>

        {fileUploadModalOpen && projectId && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => {
              setFileUploadModalOpen(false);
            }}
            role="presentation"
          >
            <div
              aria-labelledby="file-upload-modal-title"
              aria-modal="true"
              className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zk-border bg-zk-elevated p-5 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)] sm:p-6"
              onClick={(e) => {
                e.stopPropagation();
              }}
              role="dialog"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2
                    className="font-zk-sans text-lg font-semibold tracking-[-0.02em] text-zk-text sm:text-xl"
                    id="file-upload-modal-title"
                  >
                    Upload a file
                  </h2>
                  <p className="mt-1 text-sm text-zk-muted">
                    Drag in or choose a file for this project
                  </p>
                </div>
                <button
                  aria-label="Close upload"
                  className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-base/70 hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
                  onClick={() => {
                    setFileUploadModalOpen(false);
                  }}
                  type="button"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <FileUploadArea
                onUploadSuccess={() => {
                  setFileUploadModalOpen(false);
                }}
                projectId={projectId}
              />
            </div>
          </div>
        )}

        <CredentialModal
          editingCredential={editingCredential}
          isOpen={isModalOpen}
          onClose={closeModal}
          projectId={projectId}
        />

        {showDeleteConfirmModal && credentialToDeleteDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zk-elevated shadow-[0_24px_64px_-24px_rgba(0,0,0,0.65)]">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                  <Trash2 className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>
                <h2 className="mb-3 text-xl font-semibold text-red-400/95">
                  Remove this entry?
                </h2>
                <p className="mb-2 text-sm text-zk-muted">
                  This will permanently delete
                </p>
                <p className="mb-6">
                  <strong className="text-lg text-red-300/95">
                    &quot;{credentialToDeleteDetails.serviceName}&quot;
                  </strong>
                </p>
                <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                  <p className="text-center text-sm text-amber-200/85">
                    You cannot undo this.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-xl border border-zk-border py-3 text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/60 disabled:opacity-50"
                    disabled={isDeleting}
                    onClick={closeCredentialDeleteConfirmModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    disabled={isDeleting}
                    onClick={() => void executeCredentialDeletion()}
                    type="button"
                  >
                    {isDeleting ? "Removing…" : "Remove"}
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

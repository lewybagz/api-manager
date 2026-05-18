import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  FileIcon,
  Folder,
  Lock,
  Search,
  SlidersHorizontal,
  SquarePen,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";

import CredentialModal from "../components/credentials/CredentialModal";
import useAuthStore from "../stores/authStore";
import useCredentialStore, {
  type DecryptedCredential,
} from "../stores/credentialStore";
import useProjectStore from "../stores/projectStore";

const CredentialsPage: React.FC = () => {
  const { encryptionKey, masterPasswordSet, openMasterPasswordModal } =
    useAuthStore();
  const {
    credentials,
    deleteCredential,
    error: credentialsError,
    fetchAllCredentials,
    isLoading: credentialsLoading,
  } = useCredentialStore();
  const { isLoading: projectsLoading, projects } = useProjectStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<DecryptedCredential | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [revealedStates, setRevealedStates] = useState<Record<string, boolean>>(
    {}
  );
  const [clipboardTimeout, setClipboardTimeout] = useState<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const [expandedProjects, setExpandedProjects] = useState<
    Record<string, boolean>
  >({});
  const [filterOption, setFilterOption] = useState<"all" | "hasSecret">("all");
  const [sortOption, setSortOption] = useState<"latest" | "name">("latest");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [credentialToDeleteDetails, setCredentialToDeleteDetails] =
    useState<null | {
      id: string;
      projectId: string;
      serviceName: string;
    }>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all credentials
  useEffect(() => {
    if (masterPasswordSet && encryptionKey) {
      void fetchAllCredentials().catch(() => {
        toast.error("Failed to load credentials", {
          description: "Please try refreshing the page",
        });
      });
    }
  }, [masterPasswordSet, encryptionKey, fetchAllCredentials]);

  // Initialize expanded state for all projects
  useEffect(() => {
    if (projects.length > 0) {
      const initialExpandedState = projects.reduce(
        (acc, project) => ({
          ...acc,
          [project.id]: true, // Start with all projects expanded
        }),
        {}
      );
      setExpandedProjects(initialExpandedState);
    }
  }, [projects]);

  // Group credentials by project
  const credentialsByProject = useMemo(() => {
    const filtered = credentials.filter((cred) => {
      const matchesSearch =
        cred.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.apiKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cred.notes?.toLowerCase() ?? "").includes(searchQuery.toLowerCase());

      // Show all or just those with secrets if that filter is selected
      const matchesFilter =
        filterOption === "all" ? true : Boolean(cred.apiSecret);

      return matchesSearch && matchesFilter;
    });

    // Sort credentials based on sort option
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "name") {
        return a.serviceName.localeCompare(b.serviceName);
      } else {
        // Sort by latest updated or created
        const aTime = a.updatedAt?.seconds ?? a.createdAt?.seconds ?? 0;
        const bTime = b.updatedAt?.seconds ?? b.createdAt?.seconds ?? 0;
        return bTime - aTime; // Descending order (newest first)
      }
    });

    // Group by projectId
    return sorted.reduce<Record<string, DecryptedCredential[]>>(
      (acc, credential) => {
        acc[credential.projectId] = [...(acc[credential.projectId] ?? [])];
        acc[credential.projectId].push(credential);
        return acc;
      },
      {}
    );
  }, [credentials, searchQuery, sortOption, filterOption]);

  const handleToggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded = projects.reduce(
      (acc, project) => ({
        ...acc,
        [project.id]: true,
      }),
      {}
    );
    setExpandedProjects(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed = projects.reduce(
      (acc, project) => ({
        ...acc,
        [project.id]: false,
      }),
      {}
    );
    setExpandedProjects(allCollapsed);
  };

  const handleEditCredential = useCallback(
    (credential: DecryptedCredential) => {
      setEditingCredential(credential);
      setIsModalOpen(true);
    },
    []
  );

  const closeModal = useCallback(
    (success?: boolean, action?: "add" | "edit") => {
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

      // Refresh all credentials only on successful add/edit
      if (success && masterPasswordSet && encryptionKey) {
        void fetchAllCredentials().catch(() => {
          toast.error("Failed to refresh credentials", {
            description: "Please try refreshing the page",
          });
        });
      }
    },
    [masterPasswordSet, encryptionKey, fetchAllCredentials]
  );

  const confirmAndDeleteCredential = async (
    credentialId: string,
    projectId: string
  ) => {
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
      projectId: credential.projectId,
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
      await confirmAndDeleteCredential(
        credentialToDeleteDetails.id,
        credentialToDeleteDetails.projectId
      );
    }
  };

  const maskCredential = (credential: string, revealed: boolean) => {
    if (revealed) return credential;
    if (credential.length <= 4) return "••••";
    return "••••••••••••" + credential.slice(-4);
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
            // use computed property to omit without unused var warnings
            const rest = { ...prev } as Record<
              string,
              ReturnType<typeof setTimeout>
            >;
            delete rest[id];
            return rest;
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
      void copyToClipboard(text, id);
    },
    [copyToClipboard]
  );

  const toggleReveal = (fieldId: string) => {
    setRevealedStates((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const isLoading = credentialsLoading || projectsLoading;

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.projectName;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCredentials = credentials.length;
    const credentialsWithSecrets = credentials.filter(
      (cred) => cred.apiSecret
    ).length;
    const projectsWithCredentials = Object.keys(credentialsByProject).length;

    return {
      credentialsWithSecrets,
      projectsWithCredentials,
      totalCredentials,
    };
  }, [credentials, credentialsByProject]);

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
            Set your master password to unlock and securely access your saved
            keys.
          </p>
          <button
            className="w-full rounded-xl bg-zk-indigo py-3.5 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
            onClick={openMasterPasswordModal}
            type="button"
          >
            Set master password
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent font-zk-sans">
        <div className="text-center">
          <div className="mx-auto mb-6 h-1.5 w-48 overflow-hidden rounded-full bg-zk-border">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
          </div>
          <div className="space-y-2">
            <div className="mx-auto h-5 w-44 rounded-lg bg-zk-elevated animate-pulse" />
            <div className="mx-auto h-4 w-56 rounded-lg bg-zk-elevated/80 animate-pulse" />
            <div className="mx-auto h-4 w-40 rounded-lg bg-zk-elevated/60 animate-pulse" />
          </div>
          <p className="mt-6 text-sm text-zk-muted">Loading your vault…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
      <div className="p-4 sm:p-6 lg:p-8">
        <Toaster position="top-right" richColors />

        <div className="mb-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="mb-0 lg:mb-0">
              <h1 className="mb-2 text-3xl font-semibold tracking-[-0.04em] text-zk-text sm:text-4xl">
                All saved keys
              </h1>
              <p className="text-sm text-zk-muted sm:text-base">
                Browse everything in one place, grouped by project
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 lg:w-auto">
              <button
                className="flex-1 rounded-xl border border-zk-border bg-zk-elevated/50 px-4 py-2.5 text-sm font-medium text-zk-muted transition-colors hover:border-zk-indigo/30 hover:bg-zk-base/80 hover:text-zk-text lg:flex-none"
                onClick={handleExpandAll}
                type="button"
              >
                Expand all
              </button>
              <button
                className="flex-1 rounded-xl border border-zk-border bg-zk-elevated/50 px-4 py-2.5 text-sm font-medium text-zk-muted transition-colors hover:border-zk-indigo/30 hover:bg-zk-base/80 hover:text-zk-text lg:flex-none"
                onClick={handleCollapseAll}
                type="button"
              >
                Collapse all
              </button>
              <button
                className="flex flex-1 items-center gap-2 rounded-xl border border-zk-border bg-zk-elevated/50 px-4 py-2.5 text-sm font-medium text-zk-muted transition-colors hover:border-zk-indigo/30 hover:bg-zk-base/80 hover:text-zk-text lg:flex-none"
                onClick={() => {
                  setShowFilters(!showFilters);
                }}
                type="button"
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                Filters
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <div className="rounded-2xl border border-zk-border bg-zk-elevated/40 p-6 transition-colors hover:border-zk-indigo/25">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-zk-mono text-[10px] font-semibold uppercase tracking-wider text-zk-muted">
                  Total entries
                </h3>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zk-indigo/90">
                  <FileIcon className="h-4 w-4 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <p className="mb-1 font-zk-sans text-3xl font-semibold tracking-[-0.02em] text-zk-text">
                {stats.totalCredentials}
              </p>
              <p className="text-xs text-zk-muted">Across all projects</p>
            </div>

            <div className="rounded-2xl border border-zk-border bg-zk-elevated/40 p-6 transition-colors hover:border-zk-safe/30">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-zk-mono text-[10px] font-semibold uppercase tracking-wider text-zk-muted">
                  With secrets
                </h3>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zk-safe/25 text-zk-safe">
                  <Lock className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <p className="mb-1 font-zk-sans text-3xl font-semibold tracking-[-0.02em] text-zk-text">
                {stats.credentialsWithSecrets}
              </p>
              <p className="text-xs text-zk-muted">Have a secret on file</p>
            </div>

            <div className="rounded-2xl border border-zk-border bg-zk-elevated/40 p-6 transition-colors hover:border-zk-cyan/25">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-zk-mono text-[10px] font-semibold uppercase tracking-wider text-zk-muted">
                  Active projects
                </h3>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zk-cyan/15 text-zk-cyan/90">
                  <Folder className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <p className="mb-1 font-zk-sans text-3xl font-semibold tracking-[-0.02em] text-zk-text">
                {stats.projectsWithCredentials}
              </p>
              <p className="text-xs text-zk-muted">With at least one entry</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zk-indigo/90">
                  <Search className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <input
                className="w-full rounded-xl border border-zk-border bg-zk-base/80 py-3 pl-12 pr-10 font-zk-sans text-sm text-zk-text transition-colors placeholder:text-zk-muted/50 focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search by name, key, or notes…"
                type="text"
                value={searchQuery}
              />
              {searchQuery ? (
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-lg text-zk-muted transition-colors hover:text-zk-text"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </div>

            {showFilters && (
              <div className="rounded-xl border border-zk-border bg-zk-elevated/50 p-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-zk-muted"
                      htmlFor="sort-by"
                    >
                      Sort by
                    </label>
                    <select
                      className="w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-2.5 font-zk-sans text-sm text-zk-text focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30"
                      id="sort-by"
                      onChange={(e) => {
                        setSortOption(e.target.value as "latest" | "name");
                      }}
                      value={sortOption}
                    >
                      <option value="latest">Latest updated</option>
                      <option value="name">Service name</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-zk-muted"
                      htmlFor="filter-by"
                    >
                      Filter
                    </label>
                    <select
                      className="w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-2.5 font-zk-sans text-sm text-zk-text focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30"
                      id="filter-by"
                      onChange={(e) => {
                        setFilterOption(e.target.value as "all" | "hasSecret");
                      }}
                      value={filterOption}
                    >
                      <option value="all">All entries</option>
                      <option value="hasSecret">With a secret</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {credentialsError && (
          <div className="mb-6 rounded-xl border border-red-500/35 bg-red-950/25 p-4">
            <p className="text-sm text-red-300/95">
              Something went wrong: {credentialsError.message}
            </p>
          </div>
        )}

        {credentials.length === 0 && (
          <div className="rounded-2xl border border-zk-border bg-zk-elevated/30 py-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zk-border bg-zk-base/50">
              <FileIcon className="h-8 w-8 text-zk-muted" strokeWidth={1.5} />
            </div>
            <h2 className="mb-3 font-zk-sans text-xl font-semibold tracking-[-0.02em] text-zk-text sm:text-2xl">
              No entries yet
            </h2>
            <p className="mx-auto mb-8 max-w-md px-4 font-zk-sans text-sm leading-relaxed text-zk-muted">
              Create a project and add your first saved key to see it here.
            </p>
            <Link
              className="inline-flex items-center rounded-xl bg-zk-indigo px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
              to="/dashboard"
            >
              Go to dashboard
            </Link>
          </div>
        )}

        {Object.keys(credentialsByProject).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(credentialsByProject).map(
              ([projectId, projectCredentials]) => (
                <div
                  className="overflow-hidden rounded-2xl border border-zk-border bg-zk-elevated/25 transition-colors hover:border-zk-indigo/25"
                  key={projectId}
                >
                  <button
                    aria-controls={`project-content-${projectId}`}
                    aria-expanded={expandedProjects[projectId]}
                    className="flex w-full cursor-pointer items-center justify-between border-b border-zk-border bg-zk-surface/60 px-4 py-4 text-left transition-colors hover:bg-zk-elevated/40 sm:px-6 sm:py-5"
                    onClick={() => {
                      handleToggleExpand(projectId);
                    }}
                    type="button"
                  >
                    <div className="flex min-w-0 flex-grow items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
                        <Folder className="h-5 w-5 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h2 className="truncate font-zk-sans text-lg font-semibold tracking-[-0.02em] text-zk-text">
                          {getProjectName(projectId) ?? "Unknown project"}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="font-zk-sans text-sm text-zk-muted">
                            <span className="font-medium text-zk-indigo">
                              {projectCredentials.length}
                            </span>{" "}
                            {projectCredentials.length === 1
                              ? "entry"
                              : "entries"}
                          </span>
                          <Link
                            className="font-zk-sans text-sm font-medium text-zk-indigo transition-colors hover:text-zk-indigo-hover"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            to={`/project/${projectId}`}
                          >
                            Open project
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center text-zk-muted">
                      {expandedProjects[projectId] ? (
                        <ChevronUp className="h-5 w-5" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedProjects[projectId] && (
                      <motion.div
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                        exit={{ height: 0, opacity: 0 }}
                        id={`project-content-${projectId}`}
                        initial={{ height: 0, opacity: 0 }}
                        key={`project-content-${projectId}`}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
                      >
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:gap-5 md:p-6 xl:grid-cols-3">
                          {projectCredentials.map((cred) => (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="group flex h-full flex-col rounded-xl border border-zk-border bg-zk-base/40 p-5 transition-colors hover:border-zk-indigo/30 hover:bg-zk-elevated/35"
                              exit={{ opacity: 0, y: 12 }}
                              initial={{ opacity: 0, y: 12 }}
                              key={cred.id}
                              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
                            >
                              <div className="mb-4 flex items-start justify-between gap-2">
                                <h3 className="flex-grow truncate pr-2 font-zk-sans text-base font-semibold text-zk-text transition-colors group-hover:text-zk-text">
                                  {cred.serviceName}
                                </h3>
                                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                  <button
                                    className="rounded-lg p-1.5 text-zk-muted transition-colors hover:bg-zk-base/80 hover:text-zk-text"
                                    onClick={() => {
                                      handleEditCredential(cred);
                                    }}
                                    title="Edit"
                                    type="button"
                                  >
                                    <SquarePen className="h-4 w-4" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    className="rounded-lg p-1.5 text-red-400/90 transition-colors hover:bg-red-950/35 hover:text-red-300"
                                    onClick={() => {
                                      openCredentialDeleteConfirmModal(cred);
                                    }}
                                    title="Remove"
                                    type="button"
                                  >
                                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex-grow space-y-4 font-zk-sans text-sm">
                                <div>
                                  <label
                                    className="mb-2 block text-xs font-medium text-zk-muted"
                                    htmlFor={`${cred.id}-apikey`}
                                  >
                                    Key
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-grow rounded-lg border border-zk-border bg-zk-base/60 p-3">
                                      <span
                                        className="block truncate font-zk-mono text-xs text-zk-text"
                                        id={`${cred.id}-apikey`}
                                        title={
                                          revealedStates[`${cred.id}-apikey`]
                                            ? cred.apiKey
                                            : ""
                                        }
                                      >
                                        {maskCredential(
                                          cred.apiKey,
                                          revealedStates[`${cred.id}-apikey`]
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex gap-0.5">
                                      <button
                                        className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                                        onClick={() => {
                                          handleCopyToClipboard(
                                            cred.apiKey,
                                            `${cred.id}-apikey`
                                          );
                                        }}
                                        title="Copy"
                                        type="button"
                                      >
                                        {copiedStates[`${cred.id}-apikey`] ? (
                                          <CheckCircle className="h-4 w-4 text-zk-safe" strokeWidth={1.5} />
                                        ) : (
                                          <Copy className="h-4 w-4" strokeWidth={1.5} />
                                        )}
                                      </button>
                                      <button
                                        className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                                        onClick={() => {
                                          toggleReveal(`${cred.id}-apikey`);
                                        }}
                                        title={
                                          revealedStates[`${cred.id}-apikey`]
                                            ? "Hide"
                                            : "Show"
                                        }
                                        type="button"
                                      >
                                        {revealedStates[`${cred.id}-apikey`] ? (
                                          <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                                        ) : (
                                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {cred.apiSecret && (
                                  <div>
                                    <label
                                      className="mb-2 block text-xs font-medium text-zk-muted"
                                      htmlFor={`${cred.id}-apisecret`}
                                    >
                                      Secret
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <div className="min-w-0 flex-grow rounded-lg border border-zk-border bg-zk-base/60 p-3">
                                        <span
                                          className="block truncate font-zk-mono text-xs text-zk-text"
                                          id={`${cred.id}-apisecret`}
                                          title={
                                            revealedStates[
                                              `${cred.id}-apisecret`
                                            ]
                                              ? cred.apiSecret
                                              : ""
                                          }
                                        >
                                          {maskCredential(
                                            cred.apiSecret,
                                            revealedStates[
                                              `${cred.id}-apisecret`
                                            ]
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex gap-0.5">
                                        <button
                                          className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                                          onClick={() => {
                                            if (cred.apiSecret) {
                                              handleCopyToClipboard(
                                                cred.apiSecret,
                                                `${cred.id}-apisecret`
                                              );
                                            }
                                          }}
                                          title="Copy"
                                          type="button"
                                        >
                                          {copiedStates[
                                            `${cred.id}-apisecret`
                                          ] ? (
                                            <CheckCircle className="h-4 w-4 text-zk-safe" strokeWidth={1.5} />
                                          ) : (
                                            <Copy className="h-4 w-4" strokeWidth={1.5} />
                                          )}
                                        </button>
                                        <button
                                          className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                                          onClick={() => {
                                            toggleReveal(
                                              `${cred.id}-apisecret`
                                            );
                                          }}
                                          title={
                                            revealedStates[
                                              `${cred.id}-apisecret`
                                            ]
                                              ? "Hide"
                                              : "Show"
                                          }
                                          type="button"
                                        >
                                          {revealedStates[
                                            `${cred.id}-apisecret`
                                          ] ? (
                                            <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                                          ) : (
                                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {cred.notes && (
                                  <div>
                                    <label
                                      className="mb-2 block text-xs font-medium text-zk-muted"
                                      htmlFor={`${cred.id}-notes`}
                                    >
                                      Notes
                                    </label>
                                    <div
                                      className="max-h-24 overflow-y-auto rounded-lg border border-zk-border bg-zk-base/60 p-3"
                                      id={`${cred.id}-notes`}
                                    >
                                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-zk-muted">
                                        {cred.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 space-y-1 border-t border-zk-border pt-4 font-zk-sans text-xs text-zk-muted">
                                {cred.createdAt && (
                                  <div className="flex justify-between gap-2">
                                    <span>Added</span>
                                    <span className="text-zk-text/80">
                                      {new Date(
                                        cred.createdAt.seconds * 1000
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            )}
          </div>
        ) : (
          searchQuery && (
            <div className="rounded-2xl border border-zk-border bg-zk-elevated/30 py-16 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zk-border bg-zk-base/50">
                <Search className="h-8 w-8 text-zk-muted" strokeWidth={1.5} />
              </div>
              <h2 className="mb-2 font-zk-sans text-xl font-semibold text-zk-text">
                No matches
              </h2>
              <p className="font-zk-sans text-sm text-zk-muted">
                Try different words or adjust filters
              </p>
            </div>
          )
        )}

        {editingCredential && (
          <CredentialModal
            editingCredential={editingCredential}
            isOpen={isModalOpen}
            onClose={closeModal}
            projectId={editingCredential.projectId}
          />
        )}

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

export default CredentialsPage;

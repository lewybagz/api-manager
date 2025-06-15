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
    Record<string, NodeJS.Timeout>
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
      void fetchAllCredentials().catch((error: unknown) => {
        console.error("Failed to load credentials:", error);
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
        void fetchAllCredentials().catch((error: unknown) => {
          console.error("Failed to refresh credentials:", error);
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
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center p-4">
        <div className="bg-brand-dark-blue-light/80 backdrop-blur-xl border border-brand-blue/30 shadow-2xl rounded-2xl p-8 text-center max-w-md w-full">
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
          <h2 className="text-2xl font-bold text-brand-light mb-3">
            Master Password Required
          </h2>
          <p className="text-brand-gray mb-8 leading-relaxed">
            Set your master password to encrypt and securely access your
            credentials.
          </p>
          <button
            className="w-full bg-gradient-to-r from-brand-primary to-brand-blue hover:from-brand-primary-dark hover:to-brand-blue-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            onClick={openMasterPasswordModal}
          >
            Set Master Password
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-6"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-primary rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <div className="space-y-3">
            <div className="h-6 w-48 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg animate-pulse mx-auto"></div>
            <div className="h-4 w-64 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg animate-pulse mx-auto"></div>
            <div className="h-4 w-48 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary">
      <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
        <Toaster position="top-right" richColors />

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-light via-brand-blue to-brand-primary bg-clip-text text-transparent mb-2">
                All Credentials
              </h1>
              <p className="text-gray-400 text-lg">
                Manage your API credentials across all projects
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button
                className="flex-1 lg:flex-none px-4 py-2.5 text-sm bg-brand-dark-secondary/80 hover:bg-brand-dark-secondary border border-gray-700/50 hover:border-brand-blue/50 rounded-xl transition-all duration-200 text-gray-300 hover:text-brand-light"
                onClick={handleExpandAll}
              >
                Expand All
              </button>
              <button
                className="flex-1 lg:flex-none px-4 py-2.5 text-sm bg-brand-dark-secondary/80 hover:bg-brand-dark-secondary border border-gray-700/50 hover:border-brand-blue/50 rounded-xl transition-all duration-200 text-gray-300 hover:text-brand-light"
                onClick={handleCollapseAll}
              >
                Collapse All
              </button>
              <button
                className="flex-1 lg:flex-none flex items-center gap-2 px-4 py-2.5 text-sm bg-brand-dark-secondary/80 hover:bg-brand-dark-secondary border border-gray-700/50 hover:border-brand-blue/50 rounded-xl transition-all duration-200 text-gray-300 hover:text-brand-light"
                onClick={() => {
                  setShowFilters(!showFilters);
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-brand-blue/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Total Credentials
                </h3>
                <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center">
                  <FileIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-brand-light mb-1">
                {stats.totalCredentials}
              </p>
              <p className="text-xs text-gray-500">Across all projects</p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  With Secrets
                </h3>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
              </div>
              <p className="text-3xl font-bold text-brand-light mb-1">
                {stats.credentialsWithSecrets}
              </p>
              <p className="text-xs text-gray-500">Have API secrets</p>
            </div>

            <div className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Active Projects
                </h3>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Folder className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-brand-light mb-1">
                {stats.projectsWithCredentials}
              </p>
              <p className="text-xs text-gray-500">With credentials</p>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full bg-brand-dark-secondary/80 backdrop-blur-sm border border-gray-700/50 focus:border-brand-blue/50 text-brand-light pl-12 pr-4 py-3 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search credentials by name, API key, or notes..."
                type="text"
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 text-xl"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {showFilters && (
              <div className="bg-brand-dark-secondary/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2"
                      htmlFor="sort-by"
                    >
                      Sort by
                    </label>
                    <select
                      className="w-full bg-gray-800/80 text-white border border-gray-700/50 focus:border-brand-blue/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      id="sort-by"
                      onChange={(e) => {
                        setSortOption(e.target.value as "latest" | "name");
                      }}
                      value={sortOption}
                    >
                      <option value="latest">Latest Updated</option>
                      <option value="name">Service Name</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2"
                      htmlFor="filter-by"
                    >
                      Filter by
                    </label>
                    <select
                      className="w-full bg-gray-800/80 text-white border border-gray-700/50 focus:border-brand-blue/50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      id="filter-by"
                      onChange={(e) => {
                        setFilterOption(e.target.value as "all" | "hasSecret");
                      }}
                      value={filterOption}
                    >
                      <option value="all">All Credentials</option>
                      <option value="hasSecret">With API Secrets</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {credentialsError && (
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <p className="text-red-400">
              Error loading credentials: {credentialsError.message}
            </p>
          </div>
        )}

        {/* No credentials state */}
        {credentials.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-brand-light mb-3">
              No Credentials Found
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              You haven't added any API credentials yet. Create a project and
              add your first credential to get started.
            </p>
            <Link
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              to="/dashboard"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Enhanced Projects with credentials */}
        {Object.keys(credentialsByProject).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(credentialsByProject).map(
              ([projectId, projectCredentials]) => (
                <div
                  className="bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:border-brand-blue/30 transition-all duration-300 overflow-hidden"
                  key={projectId}
                >
                  <button
                    aria-controls={`project-content-${projectId}`}
                    aria-expanded={expandedProjects[projectId]}
                    className="w-full bg-gradient-to-r from-gray-800/60 to-gray-700/40 px-6 py-5 flex items-center justify-between text-left cursor-pointer hover:from-gray-800/80 hover:to-gray-700/60 transition-all duration-200"
                    onClick={() => {
                      handleToggleExpand(projectId);
                    }}
                    type="button"
                  >
                    <div className="flex items-center space-x-4 flex-grow min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Folder className="text-white h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h2 className="text-xl font-bold text-brand-light truncate">
                          {getProjectName(projectId) ?? "Unknown Project"}
                        </h2>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-400">
                            <span className="font-semibold text-brand-blue">
                              {projectCredentials.length}
                            </span>{" "}
                            credential
                            {projectCredentials.length !== 1 ? "s" : ""}
                          </span>
                          <Link
                            className="text-sm text-brand-blue hover:text-brand-blue-hover transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            to={`/project/${projectId}`}
                          >
                            View Project →
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center ml-4 flex-shrink-0">
                      {expandedProjects[projectId] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
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
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                          {projectCredentials.map((cred) => (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-brand-blue/30 transition-all duration-300 flex flex-col h-full group"
                              exit={{ opacity: 0, y: 20 }}
                              initial={{ opacity: 0, y: 20 }}
                              key={cred.id}
                              transition={{ delay: 0.1, duration: 0.3 }}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-brand-blue truncate flex-grow pr-3 group-hover:text-brand-blue-hover transition-colors">
                                  {cred.serviceName}
                                </h3>
                                <div className="flex space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-all duration-200"
                                    onClick={() => {
                                      handleEditCredential(cred);
                                    }}
                                  >
                                    <SquarePen className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                                    onClick={() => {
                                      openCredentialDeleteConfirmModal(cred);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-4 text-sm flex-grow">
                                <div>
                                  <label
                                    className="block font-medium text-gray-300 mb-2"
                                    htmlFor={`${cred.id}-apikey`}
                                  >
                                    API Key
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-grow min-w-0 bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
                                      <span
                                        className="font-mono text-gray-200 block truncate"
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
                                    <div className="flex space-x-1">
                                      <button
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                                        onClick={() => {
                                          handleCopyToClipboard(
                                            cred.apiKey,
                                            `${cred.id}-apikey`
                                          );
                                        }}
                                        title="Copy to clipboard"
                                      >
                                        {copiedStates[`${cred.id}-apikey`] ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </button>
                                      <button
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                                        onClick={() => {
                                          toggleReveal(`${cred.id}-apikey`);
                                        }}
                                        title={
                                          revealedStates[`${cred.id}-apikey`]
                                            ? "Hide"
                                            : "Show"
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
                                    <label
                                      className="block font-medium text-gray-300 mb-2"
                                      htmlFor={`${cred.id}-apisecret`}
                                    >
                                      API Secret
                                    </label>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex-grow min-w-0 bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
                                        <span
                                          className="font-mono text-gray-200 block truncate"
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
                                      <div className="flex space-x-1">
                                        <button
                                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-200"
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
                                          {copiedStates[
                                            `${cred.id}-apisecret`
                                          ] ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </button>
                                        <button
                                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-200"
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
                                        >
                                          {revealedStates[
                                            `${cred.id}-apisecret`
                                          ] ? (
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
                                    <label
                                      className="block font-medium text-gray-300 mb-2"
                                      htmlFor={`${cred.id}-notes`}
                                    >
                                      Notes
                                    </label>
                                    <div
                                      className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50"
                                      id={`${cred.id}-notes`}
                                    >
                                      <p className="text-gray-300 text-sm whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                                        {cred.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500 space-y-1">
                                {cred.createdAt && (
                                  <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span>
                                      {new Date(
                                        cred.createdAt.seconds * 1000
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {cred.updatedAt &&
                                  cred.updatedAt !== cred.createdAt && (
                                    <div className="flex justify-between">
                                      <span>Updated:</span>
                                      <span>
                                        {new Date(
                                          cred.updatedAt.seconds * 1000
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
            <div className="text-center py-16 bg-gradient-to-br from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm rounded-2xl border border-gray-800/50">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-brand-light mb-2">
                No matching credentials
              </h2>
              <p className="text-gray-400">
                Try adjusting your search terms or filters
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

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirmModal && credentialToDeleteDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-brand-dark to-brand-dark-secondary border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-red-400 text-center">
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

export default CredentialsPage;

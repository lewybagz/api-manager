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
  const { encryptionKey, masterPasswordSet } = useAuthStore();
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

      // Refresh all credentials
      if (masterPasswordSet && encryptionKey) {
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

  const handleDeleteCredential = async (
    credentialId: string,
    projectId: string
  ) => {
    const credential = credentials.find((c) => c.id === credentialId);
    if (window.confirm("Are you sure you want to delete this credential?")) {
      try {
        await deleteCredential(credentialId, projectId);
        toast.success("Credential deleted", {
          description: credential
            ? `"${credential.serviceName}" has been deleted`
            : "Credential has been deleted",
        });
      } catch (error: unknown) {
        console.error("Failed to delete credential:", error);
        toast.error("Failed to delete credential", {
          description: "Please try again later",
        });
      }
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
      <div className="bg-brand-dark-secondary p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-semibold text-brand-light mb-4">
          Master Password Required
        </h2>
        <p className="text-brand-light-secondary mb-6">
          Please enter your master password to view credentials.
        </p>
        <Link
          className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-2 px-4 rounded-md"
          to="/dashboard"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-128px)]">
        <div className="animate-pulse text-center">
          <div className="h-12 w-48 bg-gray-700 rounded-md mb-4 mx-auto"></div>
          <div className="h-4 w-64 bg-gray-700 rounded-md mb-2 mx-auto"></div>
          <div className="h-4 w-48 bg-gray-700 rounded-md mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-brand-light">
      <Toaster position="top-right" richColors />

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">All Credentials</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              View and manage all your API credentials across projects
            </p>
          </div>
          <div className="flex space-x-2 sm:space-x-3 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
            <button
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-brand-dark-secondary hover:bg-gray-700 rounded-md transition-colors text-gray-300 flex-grow sm:flex-grow-0"
              onClick={handleExpandAll}
            >
              Expand All
            </button>
            <button
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-brand-dark-secondary hover:bg-gray-700 rounded-md transition-colors text-gray-300 flex-grow sm:flex-grow-0"
              onClick={handleCollapseAll}
            >
              Collapse All
            </button>
            <button
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-brand-dark-secondary hover:bg-gray-700 rounded-md transition-colors text-gray-300 flex-grow sm:flex-grow-0"
              onClick={() => {
                setShowFilters(!showFilters);
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-brand-dark-secondary rounded-lg p-4 border border-gray-800">
            <h3 className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
              Total Credentials
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-brand-light">
              {stats.totalCredentials}
            </p>
          </div>
          <div className="bg-brand-dark-secondary rounded-lg p-4 border border-gray-800">
            <h3 className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
              With API Secrets
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-brand-light">
              {stats.credentialsWithSecrets}
            </p>
          </div>
          <div className="bg-brand-dark-secondary rounded-lg p-4 border border-gray-800">
            <h3 className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
              Projects
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-brand-light">
              {stats.projectsWithCredentials}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full min-w-[200px]">
            <input
              className="w-full bg-brand-dark-secondary border border-gray-700 text-brand-light px-10 py-2.5 text-sm sm:text-base rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Search credentials..."
              type="text"
              value={searchQuery}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-lg"
                onClick={() => {
                  setSearchQuery("");
                }}
              >
                ×
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full sm:w-auto mt-3 sm:mt-0 bg-brand-dark-secondary p-3 sm:p-4 rounded-lg border border-gray-700">
              <div className="w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-gray-400 mr-2">
                  Sort by:
                </span>
                <select
                  className="bg-gray-800 text-white border border-gray-700 rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  onChange={(e) => {
                    setSortOption(e.target.value as "latest" | "name");
                  }}
                  value={sortOption}
                >
                  <option value="latest">Latest Updated</option>
                  <option value="name">Service Name</option>
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-gray-400 mr-2">
                  Show:
                </span>
                <select
                  className="bg-gray-800 text-white border border-gray-700 rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-brand-blue"
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
          )}
        </div>
      </div>

      {credentialsError && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-6">
          <p className="text-red-400">
            Error loading credentials: {credentialsError.message}
          </p>
        </div>
      )}

      {/* No credentials state */}
      {credentials.length === 0 && (
        <div className="text-center py-12 bg-brand-dark-secondary rounded-lg shadow-lg">
          <FileIcon className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-brand-light mb-2">
            No Credentials Found
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You haven't added any API credentials yet. Add a credential to get
            started.
          </p>
          <Link
            className="inline-flex items-center px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium rounded-md transition-colors"
            to="/dashboard"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Projects with credentials */}
      {Object.keys(credentialsByProject).length > 0 ? (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(credentialsByProject).map(
            ([projectId, projectCredentials]) => (
              <div
                className="bg-brand-dark-secondary rounded-lg overflow-hidden border border-gray-800"
                key={projectId}
              >
                <button
                  aria-controls={`project-content-${projectId}`}
                  aria-expanded={expandedProjects[projectId]}
                  className="bg-gray-800/50 px-4 sm:px-6 py-3 sm:py-4 flex flex-row items-center justify-between w-full text-left cursor-pointer"
                  onClick={() => {
                    handleToggleExpand(projectId);
                  }}
                  type="button"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-grow min-w-0">
                    <Folder className="text-brand-blue h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <h2 className="text-base sm:text-xl font-semibold text-brand-light truncate">
                        {getProjectName(projectId) ?? "Unknown Project"}
                      </h2>
                      <span className="text-gray-400 text-xs sm:text-sm">
                        ({projectCredentials.length} credential
                        {projectCredentials.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center ml-2 sm:ml-0 pl-0 sm:pl-4 flex-shrink-0">
                    <Link
                      className="text-brand-blue hover:text-brand-blue-hover mr-3 sm:mr-4 text-xs sm:text-sm whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation(); // Keep this to prevent toggling expand when clicking link
                      }}
                      to={`/project/${projectId}`}
                    >
                      View Project
                    </Link>
                    {expandedProjects[projectId] ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expandedProjects[projectId] && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      id={`project-content-${projectId}`}
                      initial={{ height: 0, opacity: 0 }}
                      key={`project-content-${projectId}`}
                      layout
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {projectCredentials.map((cred) => (
                        <div
                          className="bg-gray-800/40 rounded-lg p-4 sm:p-5 shadow-sm border border-gray-700/50 flex flex-col h-full"
                          key={cred.id}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-3">
                            <h3 className="text-md sm:text-lg font-semibold text-brand-blue truncate pr-2 order-1 sm:order-none">
                              {cred.serviceName}
                            </h3>
                            <div className="flex space-x-2 flex-shrink-0 order-none sm:order-1 self-end sm:self-start mb-1 sm:mb-0">
                              <button
                                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                                onClick={() => {
                                  handleEditCredential(cred);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs text-red-500 hover:text-red-400 transition-colors"
                                onClick={() =>
                                  void handleDeleteCredential(
                                    cred.id,
                                    cred.projectId
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 text-xs sm:text-sm flex-grow">
                            <div>
                              <span className="font-medium text-gray-300">
                                API Key:
                              </span>
                              <div className="flex items-center justify-between mt-1 space-x-2">
                                <span
                                  className={`font-mono p-1.5 sm:p-2 rounded-md bg-gray-700 overflow-x-auto whitespace-nowrap text-ellipsis block ${
                                    revealedStates[`${cred.id}-apikey`]
                                      ? "text-gray-200"
                                      : "text-gray-200"
                                  } transition-colors duration-300 flex-grow min-w-0`}
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
                                <div className="flex-shrink-0 flex space-x-1 sm:space-x-2">
                                  <button
                                    className="p-1 sm:p-1.5 text-gray-400 hover:text-white transition-colors"
                                    onClick={() => {
                                      handleCopyToClipboard(
                                        cred.apiKey,
                                        `${cred.id}-apikey`
                                      );
                                    }}
                                    title="Copy to clipboard"
                                  >
                                    {copiedStates[`${cred.id}-apikey`] ? (
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    )}
                                  </button>
                                  <button
                                    className="p-1 sm:p-1.5 text-gray-400 hover:text-white transition-colors"
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
                                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                                <div className="flex items-center justify-between mt-1 space-x-2">
                                  <span
                                    className={`font-mono p-1.5 sm:p-2 rounded-md bg-gray-700 overflow-x-auto whitespace-nowrap text-ellipsis block ${
                                      revealedStates[`${cred.id}-apisecret`]
                                        ? "text-gray-200"
                                        : "text-gray-200"
                                    } transition-colors duration-300 flex-grow min-w-0`}
                                    title={
                                      revealedStates[`${cred.id}-apisecret`]
                                        ? cred.apiSecret
                                        : ""
                                    }
                                  >
                                    {maskCredential(
                                      cred.apiSecret,
                                      revealedStates[`${cred.id}-apisecret`]
                                    )}
                                  </span>
                                  <div className="flex-shrink-0 flex space-x-1 sm:space-x-2">
                                    <button
                                      className="p-1 sm:p-1.5 text-gray-400 hover:text-white transition-colors"
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
                                      {copiedStates[`${cred.id}-apisecret`] ? (
                                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      )}
                                    </button>
                                    <button
                                      className="p-1 sm:p-1.5 text-gray-400 hover:text-white transition-colors"
                                      onClick={() => {
                                        toggleReveal(`${cred.id}-apisecret`);
                                      }}
                                      title={
                                        revealedStates[`${cred.id}-apisecret`]
                                          ? "Hide"
                                          : "Show"
                                      }
                                    >
                                      {revealedStates[
                                        `${cred.id}-apisecret`
                                      ] ? (
                                        <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      ) : (
                                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {cred.notes && (
                              <div>
                                <span className="font-medium text-gray-300">
                                  Notes:
                                </span>
                                <p className="mt-1 p-1.5 sm:p-2 rounded-md bg-gray-700 text-gray-300 text-xs whitespace-pre-wrap break-words max-h-20 sm:max-h-24 overflow-y-auto">
                                  {cred.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-700/50 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
                            {cred.createdAt && (
                              <span>
                                Created:{" "}
                                {new Date(
                                  cred.createdAt.seconds * 1000
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {cred.updatedAt &&
                              cred.updatedAt !== cred.createdAt && (
                                <span className="sm:text-right">
                                  Updated:{" "}
                                  {new Date(
                                    cred.updatedAt.seconds * 1000
                                  ).toLocaleDateString()}
                                </span>
                              )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          )}
        </div>
      ) : (
        searchQuery && (
          <div className="text-center py-8 bg-brand-dark-secondary rounded-lg">
            <Search className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <h2 className="text-lg font-semibold text-brand-light mb-1">
              No matching credentials
            </h2>
            <p className="text-gray-400">
              Try adjusting your search or filters
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
    </div>
  );
};

export default CredentialsPage;

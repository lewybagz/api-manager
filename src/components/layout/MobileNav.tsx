import { signOut } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Folders,
  Home,
  Key,
  Layout,
  LogOut,
  Mail,
  PlusCircle,
  Search,
  Settings,
  Shield,
  Star,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";
import useProjectStore from "../../stores/projectStore";
import useUserStore from "../../stores/userStore";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { fetchProjects, projects } = useProjectStore();
  const { clearEncryptionKey, setError, setUser, user } = useAuthStore();
  const { clearUserDoc, fetchUserDoc, userDoc } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      void fetchProjects();
    }
  }, [user, isOpen, fetchProjects]);

  useEffect(() => {
    if (user?.uid && isOpen) {
      void fetchUserDoc(user.uid);
    }
  }, [user?.uid, isOpen, fetchUserDoc]);

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      clearUserDoc();
      clearEncryptionKey();
      onClose();
      void navigate("/login");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error);
        console.error("Logout error:", error);
      }
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleLinkClick = (path: string, state?: unknown) => {
    onClose();
    void navigate(path, { state });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            animate={{ opacity: 1 }}
            aria-hidden="true"
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[99]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.3 }}
          />

          {/* Navigation Panel */}
          <motion.div
            animate={{ x: 0 }}
            className="md:hidden fixed top-0 left-0 h-full w-full max-w-xs sm:max-w-sm bg-brand-dark-secondary shadow-2xl flex flex-col overflow-y-auto z-[100] font-sans"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut", type: "tween" }}
          >
            {/* Header with App Name and Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-brand-dark-secondary z-10">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-brand-blue" />
                <span className="ml-2 text-lg font-bold text-white">
                  API Manager
                </span>
              </div>
              <button
                aria-label="Close navigation menu"
                className="text-gray-400 hover:text-white p-1 -mr-1 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <input
                  className="w-full bg-gray-800 text-gray-200 text-sm rounded-md pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue placeholder-gray-400"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search projects..."
                  type="text"
                  value={searchQuery}
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-2 space-y-1">
              {/* Dashboard */}
              <button
                className={`flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute("/dashboard")
                    ? "bg-brand-blue text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                onClick={() => {
                  handleLinkClick("/dashboard");
                }}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </button>

              {/* Projects Section */}
              <div>
                <button
                  className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  onClick={() => {
                    setProjectsExpanded(!projectsExpanded);
                  }}
                >
                  <Folders className="h-5 w-5 mr-3" />
                  Projects
                  {projectsExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto transition-transform duration-200" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {projectsExpanded && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-1 ml-3 pl-5 border-l border-gray-700 space-y-1 overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      key="projects-dropdown"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                          <button
                            className={`flex items-center w-full px-3 py-2 rounded-md text-sm ${
                              isActiveRoute(`/project/${project.id}`)
                                ? "bg-gray-700/60 text-brand-blue font-semibold"
                                : "text-gray-300 hover:bg-gray-700/40 hover:text-brand-blue"
                            } transition-colors group`}
                            key={project.id}
                            onClick={() => {
                              handleLinkClick(`/project/${project.id}`);
                            }}
                          >
                            <Layout className="h-4 w-4 mr-2.5 flex-shrink-0" />
                            <span className="truncate flex-1 text-left">
                              {project.projectName}
                            </span>
                            <Star
                              className={`h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-70 ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "opacity-70"
                                  : ""
                              }`}
                            />
                          </button>
                        ))
                      ) : searchQuery ? (
                        <div className="text-sm text-gray-400 py-2 px-3">
                          No matching projects.
                        </div>
                      ) : (
                        <div className="bg-gray-800/50 rounded-lg p-3 my-2 border border-gray-700/50 text-center">
                          <p className="text-gray-400 text-xs mb-2">
                            No projects yet.
                          </p>
                          <button
                            className="flex items-center justify-center gap-1.5 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium py-1.5 px-2.5 rounded-md text-xs w-full transition-colors"
                            onClick={() => {
                              handleLinkClick("/dashboard", {
                                quickAdd: "project",
                              });
                            }}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            New Project
                          </button>
                        </div>
                      )}
                      <button
                        className="flex items-center w-full px-3 py-2 mt-1 rounded-md text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700/40 transition-colors"
                        onClick={() => {
                          handleLinkClick("/dashboard", {
                            quickAdd: "project",
                          });
                        }}
                      >
                        <FolderPlus className="h-4 w-4 mr-2.5" />
                        Add Project
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Documentation */}
              <button
                className={`flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute("/docs")
                    ? "bg-brand-blue text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                onClick={() => {
                  handleLinkClick("/docs");
                }}
              >
                <BookOpen className="h-5 w-5 mr-3" />
                Documentation
              </button>

              {/* All Credentials */}
              <button
                className={`flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute("/credentials")
                    ? "bg-brand-blue text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                onClick={() => {
                  handleLinkClick("/credentials");
                }}
              >
                <Key className="h-5 w-5 mr-3" />
                All Credentials
              </button>
            </nav>

            {/* User Menu & Footer */}
            <div className="mt-auto pt-2 pb-3 space-y-2">
              {user && userDoc && (
                <div className="bg-gray-800/70 mx-3 p-3 rounded-lg border border-gray-700/50">
                  <div className="flex items-center mb-2.5">
                    <div className="h-9 w-9 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-2.5 overflow-hidden">
                      <p className="font-medium text-sm text-white truncate">
                        {userDoc.displayName ?? user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mb-3 pl-1">
                    <Mail className="h-3.5 w-3.5 mr-2 text-brand-blue flex-shrink-0" />
                    <p className="truncate">{userDoc.email}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-px border border-gray-700 rounded-md overflow-hidden">
                    <button
                      className="flex items-center justify-center gap-1.5 text-xs py-2 bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 transition-colors"
                      onClick={() => {
                        handleLinkClick("/profile");
                      }}
                    >
                      <User className="h-3.5 w-3.5" /> Profile
                    </button>
                    <button
                      className="flex items-center justify-center gap-1.5 text-xs py-2 bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 transition-colors border-x border-gray-700"
                      onClick={() => {
                        handleLinkClick("/settings");
                      }}
                    >
                      <Settings className="h-3.5 w-3.5" /> Settings
                    </button>
                    <button
                      className="flex items-center justify-center gap-1.5 text-xs py-2 bg-gray-700/50 text-gray-300 hover:bg-red-900/60 hover:text-white transition-colors"
                      onClick={() => {
                        void handleLogout();
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              )}
              <div className="px-3">
                <p className="px-3 py-px text-xs text-center text-gray-500">
                  API Manager &copy; {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNav;

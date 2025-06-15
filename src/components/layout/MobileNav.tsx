"use client";

import type React from "react";

import { signOut } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
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
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
          {/* Enhanced Overlay */}
          <motion.div
            animate={{ opacity: 1 }}
            aria-hidden="true"
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[99]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.3 }}
          />

          {/* Enhanced Navigation Panel */}
          <motion.div
            animate={{ x: 0 }}
            className="md:hidden fixed top-0 left-0 h-full w-full max-w-xs sm:max-w-sm bg-gradient-to-b from-brand-dark-secondary via-brand-dark-secondary to-brand-dark shadow-2xl flex flex-col overflow-y-auto z-[100] font-sans backdrop-blur-xl border-r border-gray-800/50"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut", type: "tween" }}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 sticky top-0 bg-gradient-to-r from-brand-dark-secondary/95 to-brand-dark-secondary/90 backdrop-blur-xl z-10">
              <div className="flex items-center group">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="w-1.5 h-1.5 text-white m-0.5" />
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold text-white group-hover:text-brand-blue transition-colors duration-300">
                  Zeker
                </span>
              </div>
              <button
                aria-label="Close navigation menu"
                className="text-gray-400 hover:text-white p-2 -mr-1 rounded-xl hover:bg-gray-700/50 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Enhanced Search Box */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="relative group">
                <input
                  className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/60 backdrop-blur-sm text-gray-200 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:bg-gray-800/90 border border-gray-700/50 hover:border-brand-blue/30 transition-all duration-300 placeholder-gray-400"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search projects..."
                  type="text"
                  value={searchQuery}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full flex items-center justify-center group-focus-within:scale-110 transition-transform duration-200">
                  <Search className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            {/* Enhanced Navigation Menu */}
            <nav className="flex-1 px-4 py-3 space-y-2">
              {/* Dashboard */}
              <button
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                  isActiveRoute("/dashboard")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                onClick={() => {
                  handleLinkClick("/dashboard");
                }}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/dashboard")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <Home className="h-4 w-4" />
                </div>
                Dashboard
              </button>

              {/* Enhanced Projects Section */}
              <div>
                <button
                  className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue transition-all duration-300 group backdrop-blur-sm"
                  onClick={() => {
                    setProjectsExpanded(!projectsExpanded);
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-gray-700/50 group-hover:bg-brand-blue/20 flex items-center justify-center mr-3 transition-all duration-300">
                    <Folders className="h-4 w-4" />
                  </div>
                  Projects
                  <div
                    className={`ml-auto transition-transform duration-300 ${
                      projectsExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {projectsExpanded && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-2 ml-3 pl-6 border-l border-gray-700/50 space-y-1 overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      key="projects-dropdown"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                          <button
                            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group ${
                              isActiveRoute(`/project/${project.id}`)
                                ? "bg-gradient-to-r from-gray-700/60 to-gray-800/40 text-brand-blue font-semibold border border-brand-blue/20 shadow-lg shadow-brand-blue/10"
                                : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/40 hover:to-gray-800/20 hover:text-brand-blue backdrop-blur-sm"
                            }`}
                            key={project.id}
                            onClick={() => {
                              handleLinkClick(`/project/${project.id}`);
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center mr-3 ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "bg-brand-blue/20"
                                  : "bg-gray-600/50 group-hover:bg-brand-blue/20"
                              } transition-all duration-300`}
                            >
                              <Layout className="h-3 w-3" />
                            </div>
                            <span className="truncate flex-1 text-left">
                              {project.projectName}
                            </span>
                            <Star
                              className={`h-3.5 w-3.5 ml-2 transition-all duration-300 ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "opacity-70 text-brand-blue"
                                  : "opacity-0 group-hover:opacity-70 group-hover:text-brand-blue"
                              }`}
                            />
                          </button>
                        ))
                      ) : searchQuery ? (
                        <div className="text-sm text-gray-400 py-3 px-3 bg-gray-800/30 rounded-lg backdrop-blur-sm">
                          No matching projects.
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-3 my-2 border border-gray-700/50 text-center">
                          <div className="w-6 h-6 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full flex items-center justify-center mx-auto mb-2">
                            <Folders className="h-3 w-3 text-white" />
                          </div>
                          <p className="text-gray-400 text-xs mb-2">
                            No projects yet.
                          </p>
                          <button
                            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary text-white font-semibold py-2 px-3 rounded-lg text-xs w-full transition-all duration-300 transform hover:scale-105 shadow-lg"
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
                        className="flex items-center w-full px-3 py-2.5 mt-2 rounded-lg text-sm text-gray-400 hover:text-brand-blue hover:bg-gradient-to-r hover:from-gray-700/40 hover:to-gray-800/20 transition-all duration-300 group backdrop-blur-sm"
                        onClick={() => {
                          handleLinkClick("/dashboard", {
                            quickAdd: "project",
                          });
                        }}
                      >
                        <div className="w-5 h-5 rounded-md bg-gray-600/50 group-hover:bg-brand-blue/20 flex items-center justify-center mr-3 transition-all duration-300">
                          <FolderPlus className="h-3 w-3" />
                        </div>
                        Add Project
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Documentation */}
              <button
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                  isActiveRoute("/docs")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                onClick={() => {
                  handleLinkClick("/docs");
                }}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/docs")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <BookOpen className="h-4 w-4" />
                </div>
                Documentation
              </button>

              {/* All Credentials */}
              <button
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                  isActiveRoute("/credentials")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                onClick={() => {
                  handleLinkClick("/credentials");
                }}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/credentials")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <Key className="h-4 w-4" />
                </div>
                All Credentials
              </button>
            </nav>

            {/* Enhanced User Menu & Footer */}
            <div className="mt-auto pt-4 pb-4 space-y-3">
              {user && userDoc && (
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm mx-4 p-4 rounded-xl border border-gray-700/50 shadow-lg">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-brand-blue to-brand-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <p className="font-semibold text-sm text-white truncate">
                        {userDoc.displayName ?? user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mb-3 pl-1">
                    <div className="w-4 h-4 rounded-md bg-brand-blue/20 flex items-center justify-center mr-2">
                      <Mail className="h-2.5 w-2.5 text-brand-blue" />
                    </div>
                    <p className="truncate">{userDoc.email}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 border border-gray-700/50 rounded-lg overflow-hidden">
                    <button
                      className="flex items-center justify-center gap-1 text-xs py-2.5 bg-gradient-to-r from-gray-700/60 to-gray-800/40 text-gray-300 hover:from-brand-blue/20 hover:to-brand-primary/20 hover:text-brand-blue transition-all duration-300 backdrop-blur-sm font-medium"
                      onClick={() => {
                        handleLinkClick("/profile");
                      }}
                    >
                      <User className="h-3 w-3" /> Profile
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 text-xs py-2.5 bg-gradient-to-r from-gray-700/60 to-gray-800/40 text-gray-300 hover:from-brand-blue/20 hover:to-brand-primary/20 hover:text-brand-blue transition-all duration-300 backdrop-blur-sm font-medium border-x border-gray-700/50"
                      onClick={() => {
                        handleLinkClick("/settings");
                      }}
                    >
                      <Settings className="h-3 w-3" /> Settings
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 text-xs py-2.5 bg-gradient-to-r from-gray-700/60 to-gray-800/40 text-gray-300 hover:from-red-900/60 hover:to-red-800/40 hover:text-red-300 transition-all duration-300 backdrop-blur-sm font-medium"
                      onClick={() => {
                        void handleLogout();
                      }}
                    >
                      <LogOut className="h-3 w-3" /> Sign out
                    </button>
                  </div>
                </div>
              )}
              <div className="px-4">
                <p className="px-3 py-2 text-xs text-center text-gray-500 bg-gray-800/30 rounded-lg backdrop-blur-sm">
                  Zeker&copy; {new Date().getFullYear()}
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

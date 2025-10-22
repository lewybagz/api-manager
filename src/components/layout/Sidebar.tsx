import { signOut } from "firebase/auth";
import {
  BookOpenText,
  ChevronDown,
  FolderPlus,
  Folders,
  History,
  Home,
  Key,
  Layout,
  Mail,
  PlusCircle,
  Search,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";
import useProjectStore from "../../stores/projectStore";
import useRecentItemsStore from "../../stores/recentItemsStore";
import useUserStore from "../../stores/userStore";
import { trialDaysRemaining } from "../../utils/access";
import EncryptionStatusIndicator from "../auth/EncryptionStatusIndicator";

const Sidebar: React.FC = () => {
  const { fetchProjects, projects } = useProjectStore();
  const { clearEncryptionKey, setError, setUser, user } = useAuthStore();
  const { clearUserDoc, fetchUserDoc, userDoc } = useUserStore();
  const { items: recentItems } = useRecentItemsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [recentItemsExpanded, setRecentItemsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      void fetchProjects();
    }
  }, [user, fetchProjects]);

  useEffect(() => {
    if (user?.uid) {
      void fetchUserDoc(user.uid);
    } else {
      clearUserDoc();
    }
  }, [user?.uid, fetchUserDoc, clearUserDoc]);

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      clearUserDoc();
      clearEncryptionKey();
      void navigate("/login");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error);
      }
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 lg:w-72  bg-gradient-to-b from-brand-dark-secondary via-brand-dark-secondary to-brand-dark h-screen p-0 fixed left-0 top-0 overflow-y-auto border-r border-gray-800/50 backdrop-blur-xl hidden md:flex flex-col shadow-2xl custom-scrollbar">
      {/* Enhanced App Branding */}
      <Link
        className="px-4 py-4 flex items-center border-b border-gray-300/50 bg-gradient-to-r from-brand-dark-secondary/80 to-brand-dark-secondary/40 backdrop-blur-sm hover:from-brand-blue/10 hover:to-brand-primary/10 transition-all duration-300 group"
        to="/"
      >
        <div className="relative">
          <img
            alt="ZekerKey Logo"
            className="h-12 w-12 animate-pop-in translate-y-1 group-hover:scale-110 transition-transform duration-300"
            src="/assets/logos/logo-sidebar-40x40.png"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Sparkles className="w-2 h-2 text-white m-0.5" />
          </div>
        </div>
        <div className="flex flex-col items-start justify-start ml-3 text-xl text-white tracking-wide -translate-x-1 group-hover:text-brand-blue transition-colors duration-300">
          Zeker
          <span className="text-brand-blue text-sm ">Powered by Tovuti</span>
        </div>
      </Link>

      {/* Enhanced Search Box */}
      <div className="px-4 pt-4 pb-3">
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <nav className="px-3 py-2">
          <ul className="space-y-2">
            <li>
              <Link
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActiveRoute("/dashboard")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                to="/dashboard"
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/dashboard")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <Home className="h-3 w-3" />
                </div>
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActiveRoute("/import")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                to="/import"
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/import")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <Sparkles className="h-3 w-3" />
                </div>
                Import Credentials
              </Link>
            </li>
            <li>
              <button
                className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue transition-all duration-300 group backdrop-blur-sm"
                onClick={() => {
                  setProjectsExpanded(!projectsExpanded);
                }}
              >
                <div className="w-5 h-5 rounded-lg bg-gray-700/50 group-hover:bg-brand-blue/20 flex items-center justify-center mr-3 transition-all duration-300">
                  <Folders className="h-3 w-3" />
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

              {projectsExpanded && (
                <div className="mt-2 ml-2 pl-6 border-l border-gradient-to-b from-gray-700/50 to-transparent">
                  {filteredProjects.length > 0 ? (
                    <ul className="space-y-1 py-2">
                      {filteredProjects.map((project) => (
                        <li key={project.id}>
                          <Link
                            className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group ${
                              isActiveRoute(`/project/${project.id}`)
                                ? "bg-gradient-to-r from-gray-700/60 to-gray-800/40 text-brand-blue font-semibold border border-brand-blue/20 shadow-lg shadow-brand-blue/10"
                                : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-800/20 hover:text-brand-blue backdrop-blur-sm"
                            }`}
                            to={`/project/${project.id}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center mr-3 ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "bg-brand-blue/20"
                                  : "bg-gray-600/50 group-hover:bg-brand-blue/20"
                              } transition-all duration-300`}
                            >
                              <Layout className="h-2.5 w-2.5" />
                            </div>
                            <span className="truncate flex-1">
                              {project.projectName}
                            </span>
                            <Star
                              className={`h-3 w-3 ml-2 transition-all duration-300 ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "opacity-70 text-brand-blue"
                                  : "opacity-0 group-hover:opacity-70 group-hover:text-brand-blue"
                              }`}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : searchQuery ? (
                    <div className="text-sm text-gray-400 py-3 px-3 bg-gray-800/30 rounded-lg backdrop-blur-sm">
                      No matching projects
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 my-2 border border-gray-700/50 text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-primary rounded-full flex items-center justify-center mx-auto mb-3">
                        <Folders className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        No projects yet
                      </p>
                      <button
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue to-brand-primary hover:from-brand-blue-hover hover:to-brand-primary text-white font-semibold py-2 px-3 rounded-lg text-xs w-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        onClick={() => {
                          void navigate("/dashboard", {
                            state: { quickAdd: "project" },
                          });
                        }}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        New Project
                      </button>
                    </div>
                  )}

                  <button
                    className="flex items-center w-full px-3 py-2.5 mt-2 rounded-lg text-sm text-gray-400 hover:text-brand-blue hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-800/20 transition-all duration-300 group backdrop-blur-sm"
                    onClick={() => {
                      void navigate("/dashboard", {
                        state: { quickAdd: "project" },
                      });
                    }}
                  >
                    <div className="w-4 h-4 rounded-md bg-gray-600/50 group-hover:bg-brand-blue/20 flex items-center justify-center mr-3 transition-all duration-300">
                      <FolderPlus className="h-2.5 w-2.5" />
                    </div>
                    Add Project
                  </button>
                </div>
              )}
            </li>

            <li>
              <Link
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActiveRoute("/credentials")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                to="/credentials"
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/credentials")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <Key className="h-3 w-3" />
                </div>
                All Credentials
              </Link>
            </li>
            <li>
              <Link
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActiveRoute("/docs")
                    ? "bg-gradient-to-r from-brand-blue to-brand-primary text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue backdrop-blur-sm"
                }`}
                to="/docs"
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center mr-3 ${
                    isActiveRoute("/docs")
                      ? "bg-white/20"
                      : "bg-gray-700/50 group-hover:bg-brand-blue/20"
                  } transition-all duration-300`}
                >
                  <BookOpenText className="h-3 w-3" />
                </div>
                Documentation
              </Link>
            </li>
          </ul>
        </nav>

        {/* Enhanced Recently Accessed */}
        {recentItems.length > 0 && (
          <nav className="px-3 py-2 mt-4">
            <button
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-800/30 hover:text-brand-blue transition-all duration-300 group backdrop-blur-sm"
              onClick={() => {
                setRecentItemsExpanded(!recentItemsExpanded);
              }}
            >
              <div className="w-5 h-5 rounded-lg bg-gray-700/50 group-hover:bg-brand-blue/20 flex items-center justify-center mr-3 transition-all duration-300">
                <History className="h-3 w-3" />
              </div>
              Recently Accessed
              <div
                className={`ml-auto transition-transform duration-300 ${
                  recentItemsExpanded ? "rotate-0" : "-rotate-90"
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
            {recentItemsExpanded && (
              <div className="mt-2 ml-2 pl-6 border-l border-gradient-to-b from-gray-700/50 to-transparent">
                <ul className="space-y-1 py-2">
                  {recentItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group ${
                          isActiveRoute(`/project/${item.id}`)
                            ? "bg-gradient-to-r from-gray-700/60 to-gray-800/40 text-brand-blue font-semibold border border-brand-blue/20 shadow-lg shadow-brand-blue/10"
                            : "text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-800/20 hover:text-brand-blue backdrop-blur-sm"
                        }`}
                        to={`/project/${item.id}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center mr-3 ${
                            isActiveRoute(`/project/${item.id}`)
                              ? "bg-brand-blue/20"
                              : "bg-gray-600/50 group-hover:bg-brand-blue/20"
                          } transition-all duration-300`}
                        >
                          <Layout className="h-2.5 w-2.5" />
                        </div>
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        )}
      </div>

      {/* Enhanced User Menu */}
      <div className="mt-auto pt-4 pb-4">
        {user && userDoc && (
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm m-3 mb-3 p-4 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center mb-3">
              <User className="h-5 w-5 text-brand-blue" />
              <div className="ml-3 overflow-hidden flex-1">
                {(() => {
                  const name = userDoc.displayName ?? user.email;
                  const daysLeft = trialDaysRemaining(userDoc);
                  const status = userDoc.billing?.status;
                  const isPro = status === "active";
                  const isTrial = status === "trialing" || daysLeft > 0;
                  return (
                    <>
                      <p className="font-semibold text-sm text-white truncate">
                        {name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {isPro && (
                          <Link
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-blue text-white shadow-sm whitespace-nowrap"
                            to={`/pro/billing/${user.uid}`}
                          >
                            Pro
                          </Link>
                        )}
                        {!isPro && isTrial && (
                          <Link
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border border-yellow-500/40 bg-yellow-900/30 text-yellow-300 shadow-sm whitespace-nowrap"
                            to={`/pro/billing/${user.uid}`}
                          >
                            {daysLeft > 0
                              ? `Trial (${String(daysLeft)}d left)`
                              : "Trial"}
                          </Link>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="ml-2 flex-shrink-0">
                <EncryptionStatusIndicator />
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-400 mb-3 pl-1">
              <div className="w-4 h-4 rounded-md bg-brand-blue/20 flex items-center justify-center mr-2">
                <Mail className="h-2.5 w-2.5 text-brand-blue" />
              </div>
              <p className="truncate">{userDoc.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-1 mt-3 pt-3 border-t border-gray-700/50">
              <Link
                className="text-center text-xs py-2 px-2 rounded-lg bg-gray-700/60 text-gray-300 hover:from-brand-blue/20 hover:to-brand-primary/20 hover:text-brand-blue transition-all duration-300 backdrop-blur-sm font-medium"
                to={`/profile/${user.uid}`}
              >
                Profile
              </Link>
              <Link
                className="text-center text-xs py-2 px-2 rounded-lg bg-gray-700/60 text-gray-300 hover:from-brand-blue/20 hover:to-brand-primary/20 hover:text-brand-blue transition-all duration-300 backdrop-blur-sm font-medium"
                to={`/pro/billing/${user.uid}`}
              >
                My Plan
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-1 mt-2">
              <button
                className="text-center text-xs py-2 px-2 rounded-lg bg-gray-700/60 text-gray-300 hover:from-red-900/50 hover:to-red-800/40 hover:text-red-300 transition-all duration-300 backdrop-blur-sm font-medium"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        <div className="px-4">
          <p className="px-3 py-2 text-xs text-gray-500 text-center bg-gray-800/30 rounded-lg backdrop-blur-sm">
            Zeker&copy; {new Date().getFullYear()} - Powered by Tovuti LLC
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

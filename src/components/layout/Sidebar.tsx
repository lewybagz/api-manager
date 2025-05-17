import { signOut } from "firebase/auth";
import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Folders,
  Home,
  Key,
  Layout,
  Mail,
  PlusCircle,
  Search,
  Star,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";
import useProjectStore from "../../stores/projectStore";
import useUserStore from "../../stores/userStore";

const Sidebar: React.FC = () => {
  const { fetchProjects, projects } = useProjectStore();
  const { clearEncryptionKey, setError, setUser, user } = useAuthStore();
  const { clearUserDoc, fetchUserDoc, userDoc } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
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
        console.error("Logout error:", error);
      }
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-brand-dark-secondary h-screen p-0 fixed left-0 top-0 overflow-y-auto border-r border-gray-800 hidden md:flex flex-col">
      {/* App branding */}
      <Link
        className="px-4 py-1 flex items-center border-b border-gray-800"
        to="/"
      >
        <img
          alt="Zeker Logo"
          className="h-12 w-12 animate-pop-in translate-y-1"
          src="/assets/logos/logo-sidebar-40x40.png"
        />
        <h1 className="ml-2 text-lg font-bold text-white tracking-wide -translate-x-1">
          Zeker
        </h1>
      </Link>

      {/* Search box */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <input
            className="w-full bg-gray-800 text-gray-200 text-sm rounded-md pl-8 pr-3 py-2 focus:outline-none"
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search projects..."
            type="text"
            value={searchQuery}
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-3 py-2">
          <ul className="space-y-1">
            <li>
              <Link
                className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  isActiveRoute("/dashboard")
                    ? "bg-brand-blue text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                to="/dashboard"
              >
                <Home className="h-4 w-4 mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <button
                className="flex items-center w-full px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setProjectsExpanded(!projectsExpanded);
                }}
              >
                <Folders className="h-4 w-4 mr-3" />
                Projects
                {projectsExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </button>

              {projectsExpanded && (
                <div className="mt-1 ml-2 pl-6 border-l border-gray-700">
                  {filteredProjects.length > 0 ? (
                    <ul className="space-y-1 py-1">
                      {filteredProjects.map((project) => (
                        <li key={project.id}>
                          <Link
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${
                              isActiveRoute(`/project/${project.id}`)
                                ? "bg-gray-700/50 text-brand-blue font-medium"
                                : "text-gray-300 hover:bg-gray-700/30"
                            } transition-colors group`}
                            to={`/project/${project.id}`}
                          >
                            <Layout className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {project.projectName}
                            </span>
                            <Star
                              className={`h-3 w-3 ml-auto opacity-0 group-hover:opacity-70 ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "opacity-70"
                                  : ""
                              }`}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : searchQuery ? (
                    <div className="text-sm text-gray-400 py-2 px-3">
                      No matching projects
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4 my-2 border border-gray-700/50 text-center">
                      <p className="text-gray-400 text-sm mb-3">
                        No projects yet
                      </p>
                      <button
                        className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium py-1.5 px-3 rounded-md text-xs w-full transition-colors"
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
                    className="flex items-center w-full px-3 py-2 mt-1 rounded-md text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-700/30 transition-colors"
                    onClick={() => {
                      void navigate("/dashboard", {
                        state: { quickAdd: "project" },
                      });
                    }}
                  >
                    <FolderPlus className="h-3.5 w-3.5 mr-2" />
                    Add Project
                  </button>
                </div>
              )}
            </li>

            <li>
              <Link
                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                to="/credentials"
              >
                <Key className="h-4 w-4 mr-3" />
                All Credentials
              </Link>
            </li>
            <li>
              <Link
                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                to="/docs"
              >
                <BookOpenText className="h-4 w-4 mr-3" />
                Documentation
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* User menu (from Navbar) and settings actions */}
      <div className="mt-auto pt-2 pb-4">
        {/* User profile section */}
        {user && userDoc && (
          <div className="bg-gray-800/70 m-3 mb-2 p-3 rounded-lg border border-gray-700/50">
            <div className="flex items-center mb-2">
              <div className="h-9 w-9 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-2 overflow-hidden">
                <p className="font-medium text-sm text-white truncate">
                  {userDoc.displayName ?? user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-400 mb-2 pl-1">
              <Mail className="h-3.5 w-3.5 mr-2 text-brand-blue flex-shrink-0" />
              <p className="truncate">{userDoc.email}</p>
            </div>

            <div className="flex mt-2 pt-2 border-t border-gray-700/70">
              <Link
                className="flex-1 text-center text-xs py-1 rounded-l-md bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors border-r border-gray-500"
                to="/profile"
              >
                Profile
              </Link>
              <Link
                className="flex-1 text-center text-xs py-1 bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors border-r border-gray-500"
                to="/settings"
              >
                Settings
              </Link>
              <button
                className="flex-1 text-center text-xs py-1 rounded-r-md bg-gray-700/50 text-gray-300 hover:bg-red-900/50 transition-colors"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        <div className="px-3">
          <p className="px-3 py-px text-xs text-gray-500">
            Zeker&copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

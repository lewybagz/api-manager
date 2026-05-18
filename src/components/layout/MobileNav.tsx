"use client";

import type React from "react";

import { signOut } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  ChevronDown,
  FolderPlus,
  Folders,
  Home,
  Key,
  Layout,
  LogOut,
  Mail,
  PlusCircle,
  Settings,
  Star,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";
import useProjectStore, { type Project } from "../../stores/projectStore";
import useUserStore from "../../stores/userStore";
import GlobalSearchBar from "./GlobalSearchBar";

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
  const [navFilteredProjects, setNavFilteredProjects] = useState<Project[] | null>(
    null,
  );
  const projectsForNav = navFilteredProjects ?? projects;

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

  const primaryNav = (active: boolean) =>
    active
      ? "bg-zk-indigo text-white shadow-[0_0_20px_-8px_rgba(99,102,241,0.45)]"
      : "text-zk-muted hover:bg-zk-elevated hover:text-zk-text";

  const iconWrap = (active: boolean) =>
    active
      ? "bg-white/15 text-white"
      : "bg-zk-base/70 text-zk-muted group-hover:bg-zk-indigo/15 group-hover:text-zk-text";

  const subNav = (active: boolean) =>
    active
      ? "border border-zk-indigo/35 bg-zk-indigo/10 font-medium text-zk-text"
      : "text-zk-muted hover:bg-zk-base/60 hover:text-zk-text";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            aria-hidden="true"
            className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm md:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            animate={{ x: 0 }}
            className="fixed left-0 top-0 z-[100] flex h-full w-full max-w-xs flex-col overflow-y-auto border-r border-zk-border bg-zk-surface font-zk-sans backdrop-blur-xl sm:max-w-sm md:hidden"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] as const, type: "tween" }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zk-border bg-zk-surface/95 px-4 py-3 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  alt="ZekerKey"
                  className="h-9 w-9 shrink-0 rounded-lg opacity-95"
                  src="/assets/logos/logo-sidebar-40x40.png"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="font-zk-sans text-lg font-semibold tracking-[-0.03em] text-zk-text">
                    Zeker
                  </span>
                  <span className="font-zk-sans text-[10px] font-medium uppercase tracking-[0.12em] text-zk-muted">
                    Powered by Tovuti
                  </span>
                </div>
              </div>
              <button
                aria-label="Close navigation menu"
                className="-mr-1 rounded-xl p-2 text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/35"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <GlobalSearchBar
              onFilteredProjectsChange={setNavFilteredProjects}
              onNavigate={onClose}
              variant="mobile"
            />

            <nav className="flex-1 space-y-1 px-2 py-3">
              <button
                className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/dashboard"))}`}
                onClick={() => {
                  handleLinkClick("/dashboard");
                }}
                type="button"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/dashboard"))}`}
                >
                  <Home className="h-4 w-4" strokeWidth={1.5} />
                </div>
                Dashboard
              </button>

              <div>
                <button
                  className="group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zk-muted transition-colors duration-200 hover:bg-zk-elevated hover:text-zk-text"
                  onClick={() => {
                    setProjectsExpanded(!projectsExpanded);
                  }}
                  type="button"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-zk-base/70 text-zk-muted transition-colors group-hover:bg-zk-indigo/15 group-hover:text-zk-text">
                    <Folders className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  Projects
                  <div
                    className={`ml-auto transition-transform duration-200 ${
                      projectsExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {projectsExpanded && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="ml-3 mt-1 space-y-1 overflow-hidden border-l border-zk-border pl-3"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      key="projects-dropdown"
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
                    >
                      {projectsForNav.length > 0 ? (
                        projectsForNav.map((project) => (
                          <button
                            className={`group flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 ${subNav(isActiveRoute(`/project/${project.id}`))}`}
                            key={project.id}
                            onClick={() => {
                              handleLinkClick(`/project/${project.id}`);
                            }}
                            type="button"
                          >
                            <div
                              className={`mr-3 flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "bg-zk-indigo/25 text-zk-indigo"
                                  : "bg-zk-base/60 text-zk-muted group-hover:bg-zk-indigo/15 group-hover:text-zk-text"
                              }`}
                            >
                              <Layout className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </div>
                            <span className="min-w-0 flex-1 truncate text-left">
                              {project.projectName}
                            </span>
                            <Star
                              className={`ml-2 h-3.5 w-3.5 shrink-0 transition-opacity ${
                                isActiveRoute(`/project/${project.id}`)
                                  ? "text-zk-indigo opacity-80"
                                  : "opacity-0 group-hover:text-zk-indigo group-hover:opacity-70"
                              }`}
                              strokeWidth={1.5}
                            />
                          </button>
                        ))
                      ) : projectsForNav.length === 0 && projects.length > 0 ? (
                        <div className="rounded-lg border border-zk-border bg-zk-base/40 px-3 py-3 text-sm text-zk-muted">
                          Nothing in your project list matches that search.
                        </div>
                      ) : (
                        <div className="my-2 rounded-xl border border-zk-border bg-zk-elevated/40 p-3 text-center">
                          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-zk-indigo/90">
                            <Folders className="h-4 w-4 text-white" strokeWidth={1.5} />
                          </div>
                          <p className="mb-2 text-xs text-zk-muted">No projects yet.</p>
                          <button
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zk-indigo py-2 text-xs font-medium text-white transition-colors hover:bg-zk-indigo-hover"
                            onClick={() => {
                              handleLinkClick("/dashboard", {
                                quickAdd: "project",
                              });
                            }}
                            type="button"
                          >
                            <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                            New project
                          </button>
                        </div>
                      )}
                      <button
                        className="group mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-zk-muted transition-colors hover:bg-zk-base/60 hover:text-zk-text"
                        onClick={() => {
                          handleLinkClick("/dashboard", {
                            quickAdd: "project",
                          });
                        }}
                        type="button"
                      >
                        <div className="mr-3 flex h-7 w-7 items-center justify-center rounded-md bg-zk-base/60 text-zk-muted transition-colors group-hover:bg-zk-indigo/15 group-hover:text-zk-text">
                          <FolderPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        Add project
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/docs"))}`}
                onClick={() => {
                  handleLinkClick("/docs");
                }}
                type="button"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/docs"))}`}
                >
                  <BookOpenText className="h-4 w-4" strokeWidth={1.5} />
                </div>
                Documentation
              </button>

              <button
                className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/credentials"))}`}
                onClick={() => {
                  handleLinkClick("/credentials");
                }}
                type="button"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/credentials"))}`}
                >
                  <Key className="h-4 w-4" strokeWidth={1.5} />
                </div>
                All credentials
              </button>
            </nav>

            <div className="mt-auto space-y-3 pb-4 pt-2">
              {user && userDoc && (
                <div className="mx-2 rounded-xl border border-zk-border bg-zk-elevated/50 p-3">
                  <div className="mb-2 flex items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zk-indigo/90">
                      <User className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="ml-3 min-w-0 flex-1 overflow-hidden">
                      <p className="truncate font-zk-sans text-sm font-medium text-zk-text">
                        {userDoc.displayName ?? user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-2 pl-0.5 font-zk-sans text-xs text-zk-muted">
                    <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    <p className="truncate">{userDoc.email}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg border border-zk-border">
                    <button
                      className="flex items-center justify-center gap-1 bg-zk-base/60 py-2.5 font-zk-sans text-xs font-medium text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                      onClick={() => {
                        handleLinkClick("/profile");
                      }}
                      type="button"
                    >
                      <User className="h-3 w-3" strokeWidth={1.5} /> Profile
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 border-x border-zk-border bg-zk-base/60 py-2.5 font-zk-sans text-xs font-medium text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                      onClick={() => {
                        handleLinkClick("/settings");
                      }}
                      type="button"
                    >
                      <Settings className="h-3 w-3" strokeWidth={1.5} /> Settings
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 bg-zk-base/60 py-2.5 font-zk-sans text-xs font-medium text-zk-muted transition-colors hover:bg-red-950/40 hover:text-red-300/95"
                      onClick={() => {
                        void handleLogout();
                      }}
                      type="button"
                    >
                      <LogOut className="h-3 w-3" strokeWidth={1.5} /> Sign out
                    </button>
                  </div>
                </div>
              )}
              <div className="px-3">
                <p className="rounded-lg bg-zk-base/40 px-2 py-2 text-center font-zk-mono text-[10px] leading-relaxed text-zk-muted/80">
                  Zeker © {new Date().getFullYear()} · Tovuti LLC
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

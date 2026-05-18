import { signOut } from "firebase/auth";
import {
  BookOpenText,
  ChevronDown,
  FolderPlus,
  Folders,
  History,
  Home,
  Key,
  FolderGit2,
  FolderOpenDot,
  Mail,
  PlusCircle,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { auth } from "../../firebase";
import useAuthStore from "../../stores/authStore";
import useProjectStore, { type Project } from "../../stores/projectStore";
import useRecentItemsStore from "../../stores/recentItemsStore";
import useUserStore from "../../stores/userStore";
import { trialDaysRemaining } from "../../utils/access";
import EncryptionStatusIndicator from "../auth/EncryptionStatusIndicator";
import GlobalSearchBar from "./GlobalSearchBar";

const Sidebar: React.FC = () => {
  const { fetchProjects, projects } = useProjectStore();
  const { clearEncryptionKey, setError, setUser, user } = useAuthStore();
  const { clearUserDoc, fetchUserDoc, userDoc } = useUserStore();
  const { items: recentItems } = useRecentItemsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [recentItemsExpanded, setRecentItemsExpanded] = useState(true);
  const [navFilteredProjects, setNavFilteredProjects] = useState<
    Project[] | null
  >(null);
  const projectsForNav = navFilteredProjects ?? projects;

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
    <div className="custom-scrollbar fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col overflow-y-auto border-r border-zk-border bg-zk-surface md:flex lg:w-72">
      <Link
        className="group flex items-center border-b border-zk-border bg-zk-base/40 px-4 py-4 transition-colors hover:bg-zk-elevated/50"
        to="/"
      >
        <div className="relative shrink-0">
          <img
            alt="ZekerKey"
            className="h-11 w-11 rounded-lg opacity-95 transition-opacity group-hover:opacity-100"
            src="/assets/logos/logo-sidebar-40x40.png"
          />
        </div>
        <div className="ml-3 flex min-w-0 flex-col">
          <span className="font-zk-sans text-lg font-semibold tracking-[-0.03em] text-zk-text">
            Zeker
          </span>
          <span className="font-zk-sans text-[10px] font-medium uppercase tracking-[0.12em] text-zk-muted">
            Powered by Tovuti
          </span>
        </div>
      </Link>

      <GlobalSearchBar
        onFilteredProjectsChange={setNavFilteredProjects}
        variant="sidebar"
      />

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        <nav className="px-2 py-2 font-zk-sans">
          <ul className="space-y-1">
            <li>
              <Link
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/dashboard"))}`}
                to="/dashboard"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/dashboard"))}`}
                >
                  <Home className="h-4 w-4" strokeWidth={1.5} />
                </div>
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/import"))}`}
                to="/import"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/import"))}`}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                </div>
                Import credentials
              </Link>
            </li>
            <li>
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
                  className={`ml-auto text-zk-muted transition-transform duration-200 ${
                    projectsExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </button>

              {projectsExpanded && (
                <div className="flex flex-col">
                  {recentItems.length > 0 && (
                    <nav className="ml-1 ml-6 pr-1 pl-3 py-3 bg-black/20 backdrop-blur-sm rounded-lg">
                      <button
                        className="group flex w-full items-center rounded-lg px-2 pl-2 pr-4 text-left text-sm font-medium text-zk-muted transition-colors hover:bg-zk-base/50 hover:text-zk-text"
                        onClick={() => {
                          setRecentItemsExpanded(!recentItemsExpanded);
                        }}
                        type="button"
                      >
                        <div className="mr-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-zk-base/60 text-zk-muted group-hover:text-zk-text">
                          <History
                            className="h-3.5 w-3.5 text-zk-indigo"
                            strokeWidth={1.5}
                          />
                        </div>
                        Recently accessed
                        <div
                          className={`ml-auto text-zk-muted transition-transform ${
                            recentItemsExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                      </button>
                      {recentItemsExpanded && (
                        <div className="ml-2 mt-1 border-l border-zk-border pl-3">
                          <ul className="space-y-0.5 py-1">
                            {recentItems.map((item) => {
                              const itemActive = isActiveRoute(
                                `/project/${item.id}`,
                              );
                              return (
                                <li key={item.id}>
                                  <Link
                                    className={`group flex items-center rounded-lg px-2.5 py-2 text-sm transition-colors ${subNav(isActiveRoute(`/project/${item.id}`))}`}
                                    to={`/project/${item.id}`}
                                  >
                                    <div
                                      className={`mr-2.5 flex h-6 w-6 items-center justify-center rounded-md ${iconWrap(isActiveRoute(`/project/${item.id}`))}`}
                                    >
                                      {itemActive ? (
                                        <FolderOpenDot
                                          className="h-5 w-5"
                                          strokeWidth={1.5}
                                        />
                                      ) : (
                                        <FolderGit2
                                          className="h-5 w-5 text-zk-indigo"
                                          strokeWidth={1.5}
                                        />
                                      )}
                                    </div>
                                    <span className="truncate">
                                      {item.name}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </nav>
                  )}
                  <div className="ml-2 mt-1 border-l border-zk-border pl-3">
                    {projectsForNav.length > 0 ? (
                      <ul className="space-y-0.5 py-1">
                        {projectsForNav.map((project) => {
                          const projectActive = isActiveRoute(
                            `/project/${project.id}`,
                          );
                          return (
                            <li key={project.id}>
                              <Link
                                className={`group flex items-center rounded-lg px-2.5 py-2 text-sm transition-colors ${subNav(projectActive)}`}
                                to={`/project/${project.id}`}
                              >
                                <div
                                  className={`mr-2.5 flex h-6 w-6 items-center justify-center rounded-md ${iconWrap(projectActive)}`}
                                >
                                  {projectActive ? (
                                    <FolderOpenDot
                                      className="h-5 w-5"
                                      strokeWidth={1.5}
                                    />
                                  ) : (
                                    <FolderGit2
                                      className="h-5 w-5 text-zk-indigo"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                </div>
                                <span className="min-w-0 flex-1 truncate">
                                  {project.projectName}
                                </span>
                                <Star
                                  className={`ml-1 h-3.5 w-3.5 shrink-0 transition-opacity ${
                                    projectActive
                                      ? "text-zk-indigo opacity-80"
                                      : "opacity-0 text-zk-muted group-hover:opacity-70"
                                  }`}
                                  strokeWidth={1.5}
                                />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : projectsForNav.length === 0 && projects.length > 0 ? (
                      <div className="my-2 rounded-lg border border-zk-border bg-zk-base/50 px-3 py-2.5 text-xs text-zk-muted">
                        Nothing in your project list matches that search.
                      </div>
                    ) : (
                      <div className="my-2 rounded-xl border border-zk-border bg-zk-elevated/40 p-4 text-center">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zk-indigo/20">
                          <Folders
                            className="h-5 w-5 text-zk-indigo"
                            strokeWidth={1.5}
                          />
                        </div>
                        <p className="mb-3 text-sm text-zk-muted">
                          No projects yet
                        </p>
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zk-indigo py-2.5 text-xs font-medium text-white transition-colors hover:bg-zk-indigo-hover"
                          onClick={() => {
                            void navigate("/dashboard", {
                              state: { quickAdd: "project" },
                            });
                          }}
                          type="button"
                        >
                          <PlusCircle
                            className="h-3.5 w-3.5"
                            strokeWidth={1.5}
                          />
                          New project
                        </button>
                      </div>
                    )}

                    <button
                      className="group mt-1 flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm text-zk-muted transition-colors hover:bg-zk-base/50 hover:text-zk-text"
                      onClick={() => {
                        void navigate("/dashboard", {
                          state: { quickAdd: "project" },
                        });
                      }}
                      type="button"
                    >
                      <div className="mr-2.5 flex h-6 w-6 items-center justify-center rounded-md bg-zk-base/60 text-zk-muted group-hover:text-zk-indigo">
                        <FolderPlus className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                      Add project
                    </button>
                  </div>
                </div>
              )}
            </li>

            <li>
              <Link
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/credentials"))}`}
                to="/credentials"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/credentials"))}`}
                >
                  <Key className="h-4 w-4" strokeWidth={1.5} />
                </div>
                All credentials
              </Link>
            </li>
            <li>
              <Link
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${primaryNav(isActiveRoute("/docs"))}`}
                to="/docs"
              >
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${iconWrap(isActiveRoute("/docs"))}`}
                >
                  <BookOpenText className="h-4 w-4" strokeWidth={1.5} />
                </div>
                Documentation
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mt-auto border-t border-zk-border pb-3 pt-2">
        {user && userDoc && (
          <div className="mx-2 mb-2 rounded-xl border border-zk-border bg-zk-elevated/50 p-3">
            <div className="mb-2 flex items-start">
              <User
                className="mt-0.5 h-4 w-4 shrink-0 text-zk-indigo"
                strokeWidth={1.5}
              />
              <div className="ml-2.5 min-w-0 flex-1">
                {(() => {
                  const name = userDoc.displayName ?? user.email;
                  const daysLeft = trialDaysRemaining(userDoc);
                  const status = userDoc.billing?.status;
                  const isPro = status === "active";
                  const isTrial = status === "trialing" || daysLeft > 0;
                  return (
                    <>
                      <p className="truncate font-zk-sans text-sm font-medium text-zk-text">
                        {name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {isPro && (
                          <Link
                            className="inline-flex items-center rounded-md bg-transparent font-zk-mono text-[10px] font-semibold uppercase tracking-wide text-zk-indigo"
                            to={`/pro/billing/${user.uid}`}
                          >
                            Pro
                            <Star
                              className="ml-0.5 h-3 w-3"
                              strokeWidth={1.5}
                            />
                          </Link>
                        )}
                        {!isPro && isTrial && (
                          <Link
                            className="inline-flex items-center rounded-md border border-amber-500/35 bg-amber-950/25 px-2 py-0.5 font-zk-mono text-[10px] font-semibold uppercase tracking-wide text-amber-200/95"
                            to={`/pro/billing/${user.uid}`}
                          >
                            {daysLeft > 0
                              ? `Trial (${String(daysLeft)}d)`
                              : "Trial"}
                          </Link>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="ml-1 shrink-0">
                <EncryptionStatusIndicator />
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2 pl-0.5 font-zk-sans text-xs text-zk-muted">
              <Mail
                className="h-3.5 w-3.5 shrink-0 text-zk-muted"
                strokeWidth={1.5}
              />
              <p className="truncate">{userDoc.email}</p>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1 border-t border-zk-border pt-2">
              <Link
                className="rounded-lg bg-zk-base/60 py-2 text-center font-zk-sans text-xs font-medium text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                to={`/profile/${user.uid}`}
              >
                Profile
              </Link>
              <Link
                className="rounded-lg bg-zk-base/60 py-2 text-center font-zk-sans text-xs font-medium text-zk-muted transition-colors hover:bg-zk-elevated hover:text-zk-text"
                to={`/pro/billing/${user.uid}`}
              >
                My plan
              </Link>
            </div>
            <button
              className="mt-1.5 w-full rounded-lg bg-zk-base/50 py-2 text-center font-zk-sans text-xs font-medium text-zk-muted transition-colors hover:bg-red-950/40 hover:text-red-300/95"
              onClick={() => void handleLogout()}
              type="button"
            >
              Sign out
            </button>
          </div>
        )}

        <div className="px-3 pb-2">
          <p className="rounded-lg bg-zk-base/40 px-2 py-2 text-center font-zk-mono text-[10px] leading-relaxed text-zk-muted/80">
            Zeker © {new Date().getFullYear()} · Tovuti LLC
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

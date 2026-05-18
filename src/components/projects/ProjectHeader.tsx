import {
  ArrowLeft,
  Download,
  MoreVertical,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useProjectStore, { type ProjectStatus } from "../../stores/projectStore";

type HeaderMenu = "actions" | "filters" | null;

interface ProjectHeaderProps {
  onAddCredential: () => void;
  canExportEnv?: boolean;
  onExportEnv?: () => void;
  projectCreatedAt: null | undefined | { nanoseconds: number; seconds: number };
  projectName: string;
  projectId?: string;
  status?: ProjectStatus;
  categoryFilter?: string; // 'all' | specific category
  // Parameter name is documentation for implementers; not referenced in this file.
  // eslint-disable-next-line no-unused-vars
  onCategoryFilterChange?: (value: string) => void;
}

const selectClass =
  "w-full rounded-lg border border-zk-border bg-zk-base/80 px-3 py-2 font-zk-sans text-sm text-zk-text focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30";

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  onAddCredential,
  canExportEnv = false,
  onExportEnv,
  projectCreatedAt,
  projectName,
  projectId,
  status = "active",
  categoryFilter = "all",
  onCategoryFilterChange,
}) => {
  const { updateProject } = useProjectStore();
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);

  useEffect(() => {
    if (openMenu === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = document.querySelector(
        `[data-project-header-popover="${openMenu}"]`,
      );
      if (el?.contains(e.target as Node)) return;
      setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openMenu]);

  useEffect(() => {
    if (openMenu === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

  const toggleMenu = (menu: Exclude<HeaderMenu, null>) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <div className="relative flex flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3">
      <div className="flex items-center justify-between">
        <Link
          className="group flex w-fit items-center gap-1.5 font-zk-sans text-sm font-medium text-zk-indigo transition-colors hover:text-zk-indigo-hover"
          to="/dashboard"
        >
          <ArrowLeft
            className="h-4 w-4 shrink-0 group-hover:-translate-x-2 transition-transform duration-200"
            strokeWidth={1.5}
          />
          Back to dashboard
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 pt-0.5 sm:pt-1">
          <div className="relative z-[100]" data-project-header-popover="filters">
            <button
              aria-expanded={openMenu === "filters"}
              aria-haspopup="true"
              aria-label="Filters"
              className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-base/70 hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/30"
              onClick={() => toggleMenu("filters")}
              type="button"
            >
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
            </button>
            {openMenu === "filters" && (
              <div
                className="absolute right-0 top-full z-[110] mt-1 w-[min(100vw-2rem,18rem)] min-w-[16rem] rounded-xl border border-zk-border bg-zk-elevated p-3 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.55)]"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <p className="mb-3 font-zk-sans text-xs font-medium uppercase tracking-wide text-zk-muted">
                  Filters
                </p>
                <div className="flex flex-col gap-4">
                  {projectId && (
                    <div>
                      <label
                        className="mb-1.5 block text-sm font-medium text-zk-muted"
                        htmlFor="project-header-status"
                      >
                        Project status
                      </label>
                      <select
                        className={selectClass}
                        id="project-header-status"
                        onChange={(e) => {
                          const newStatus = e.target.value as ProjectStatus;
                          void updateProject(projectId, { status: newStatus });
                        }}
                        value={status}
                      >
                        <option value="active">Active</option>
                        <option value="planned">Planned</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label
                      className="mb-1.5 block text-sm font-medium text-zk-muted"
                      htmlFor="project-header-category"
                    >
                      Credential category
                    </label>
                    <select
                      className={selectClass}
                      id="project-header-category"
                      onChange={(e) => {
                        onCategoryFilterChange?.(e.target.value);
                      }}
                      value={categoryFilter}
                    >
                      <option value="all">All categories</option>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="database">Database</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="devops">DevOps</option>
                      <option value="mobile">Mobile</option>
                      <option value="analytics">Analytics</option>
                      <option value="other">Other</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-[100]" data-project-header-popover="actions">
            <button
              aria-expanded={openMenu === "actions"}
              aria-haspopup="true"
              aria-label="More actions"
              className="rounded-lg p-2 text-zk-muted transition-colors hover:bg-zk-base/70 hover:text-zk-text focus:outline-none focus-visible:ring-2 focus-visible:ring-zk-indigo/30"
              onClick={() => toggleMenu("actions")}
              type="button"
            >
              <MoreVertical className="h-5 w-5" strokeWidth={1.5} />
            </button>
            {openMenu === "actions" && (
              <div
                className="absolute right-0 top-full z-[110] mt-1 min-w-[12.5rem] overflow-hidden rounded-xl border border-zk-border bg-zk-elevated py-1 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.55)]"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                role="menu"
              >
                {onExportEnv && (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zk-text transition-colors hover:bg-zk-base/60 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={!canExportEnv}
                    onClick={() => {
                      onExportEnv();
                      setOpenMenu(null);
                    }}
                    role="menuitem"
                    title={
                      canExportEnv
                        ? "Download a file with your keys for this project"
                        : "Add at least one credential first"
                    }
                    type="button"
                  >
                    <Download
                      className="h-4 w-4 shrink-0 text-zk-indigo"
                      strokeWidth={1.5}
                    />
                    Download .env
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 bg-zk-indigo px-3 py-2.5 text-left text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover"
                  onClick={() => {
                    setOpenMenu(null);
                    onAddCredential();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  Add credential
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="max-w-full truncate font-zk-sans text-2xl font-semibold tracking-[-0.03em] text-zk-text sm:text-3xl">
            {projectName}
          </h1>
          {projectCreatedAt && (
            <p className="mt-0.5 font-zk-sans text-sm text-zk-muted">
              Created{" "}
              {new Date(projectCreatedAt.seconds * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;

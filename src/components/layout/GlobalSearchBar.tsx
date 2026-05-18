"use client";

import { Folder, Key, Layout, Loader2, Search } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import useAuthStore from "../../stores/authStore";
import useCredentialStore, {
  type DecryptedCredential,
} from "../../stores/credentialStore";
import useProjectStore, { type Project } from "../../stores/projectStore";

const tokenize = (raw: string): string[] => {
  const t = raw.trim().toLowerCase();
  if (!t) return [];
  return t.split(/\s+/).filter(Boolean);
};

const matchesTokens = (haystack: string, tokens: string[]): boolean => {
  if (tokens.length === 0) return true;
  const h = haystack.toLowerCase();
  return tokens.every((tok) => h.includes(tok));
};

const categoryLabel = (cat: string | undefined): string => {
  if (!cat || cat === "none") return "";
  return cat.replace(/-/g, " ");
};

type SearchVariant = "dashboard" | "mobile" | "page" | "sidebar";

export interface GlobalSearchBarProps {
  className?: string;
  onFilteredProjectsChange?: (projects: Project[]) => void;
  onNavigate?: () => void;
  /** When set, matching credentials from this project appear first in results. */
  prioritizeProjectId?: string;
  /** Syncs the search text to the parent (e.g. filter lists on the same page). */
  onQueryChange?: (query: string) => void;
  variant?: SearchVariant;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  className = "",
  onFilteredProjectsChange,
  onNavigate,
  onQueryChange,
  prioritizeProjectId,
  variant = "sidebar",
}) => {
  const listboxId = useId();
  const navigate = useNavigate();
  const { encryptionKey, masterPasswordSet, openMasterPasswordModal } =
    useAuthStore();
  const { projects } = useProjectStore();
  const {
    globalSearchCredentials,
    globalSearchIndexLoading,
    refreshGlobalSearchIndex,
  } = useCredentialStore();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tokens = useMemo(() => tokenize(query), [query]);

  const projectNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of projects) m[p.id] = p.projectName;
    return m;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (tokens.length === 0) return projects;
    return projects.filter((p) => {
      const hay = [
        p.projectName,
        p.status,
        p.lastCredentialSummary?.serviceName ?? "",
        p.id,
      ].join(" ");
      return matchesTokens(hay, tokens);
    });
  }, [projects, tokens]);

  useEffect(() => {
    onFilteredProjectsChange?.(filteredProjects);
  }, [filteredProjects, onFilteredProjectsChange]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  const credentialRows = useMemo(() => {
    if (tokens.length === 0 || !encryptionKey) return [];
    const rows: { cred: DecryptedCredential; projectName: string }[] = [];
    for (const c of globalSearchCredentials) {
      const pname = projectNameById[c.projectId] ?? "";
      const hay = [
        pname,
        c.serviceName,
        c.category ?? "",
        c.notes ?? "",
        c.apiKey,
        c.apiSecret ?? "",
      ].join(" ");
      if (matchesTokens(hay, tokens)) {
        rows.push({ cred: c, projectName: pname });
      }
    }
    const pid = prioritizeProjectId;
    if (pid) {
      rows.sort((a, b) => {
        const ap = a.cred.projectId === pid ? 0 : 1;
        const bp = b.cred.projectId === pid ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.cred.serviceName.localeCompare(b.cred.serviceName);
      });
    } else {
      rows.sort((a, b) => a.cred.serviceName.localeCompare(b.cred.serviceName));
    }
    return rows.slice(0, 20);
  }, [
    encryptionKey,
    globalSearchCredentials,
    prioritizeProjectId,
    projectNameById,
    tokens,
  ]);

  const projectQuickHits = useMemo(() => {
    if (tokens.length === 0) return [];
    const list = [...filteredProjects];
    const pid = prioritizeProjectId;
    if (pid) {
      list.sort((a, b) => {
        const ap = a.id === pid ? 0 : 1;
        const bp = b.id === pid ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.projectName.localeCompare(b.projectName);
      });
    }
    return list.slice(0, 8);
  }, [filteredProjects, prioritizeProjectId, tokens]);

  const flatNavTargets = useMemo(() => {
    const targets: { kind: "credential" | "project"; key: string }[] = [];
    for (const p of projectQuickHits) {
      targets.push({ kind: "project", key: p.id });
    }
    for (const { cred } of credentialRows) {
      targets.push({ kind: "credential", key: cred.id });
    }
    return targets;
  }, [credentialRows, projectQuickHits]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, flatNavTargets.length]);

  const ensureIndexLoaded = useCallback(() => {
    if (!encryptionKey || !masterPasswordSet) return;
    void refreshGlobalSearchIndex();
  }, [encryptionKey, masterPasswordSet, refreshGlobalSearchIndex]);

  const handleFocus = () => {
    setOpen(true);
    ensureIndexLoaded();
  };

  const closePanel = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) closePanel();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const goProject = (projectId: string) => {
    void navigate(`/project/${projectId}`);
    closePanel();
    onNavigate?.();
  };

  const goCredential = (projectId: string, credentialId: string) => {
    void navigate(
      `/project/${projectId}?modal=credential&id=${encodeURIComponent(credentialId)}`,
    );
    setQuery("");
    closePanel();
    onNavigate?.();
  };

  const showPanel = open && (tokens.length > 0 || globalSearchIndexLoading);

  const showHintRow = tokens.length > 0 && !encryptionKey;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatNavTargets.length === 0) return;
      setActiveIndex((i) => (i + 1) % flatNavTargets.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatNavTargets.length === 0) return;
      setActiveIndex(
        (i) => (i - 1 + flatNavTargets.length) % flatNavTargets.length,
      );
    } else if (e.key === "Enter") {
      if (flatNavTargets.length === 0) return;
      const t = flatNavTargets[activeIndex];
      if (!t) return;
      e.preventDefault();
      if (t.kind === "project") {
        goProject(t.key);
      } else {
        const row = credentialRows.find((r) => r.cred.id === t.key);
        if (row) goCredential(row.cred.projectId, row.cred.id);
      }
    }
  };

  const paddingClass =
    variant === "mobile"
      ? "border-b border-zk-border p-4"
      : variant === "sidebar"
        ? "px-4 pt-4 pb-3"
        : variant === "dashboard" || variant === "page"
          ? "rounded-2xl bg-zk-elevated/30 p-3 sm:p-4"
          : "";

  let flatCursor = -1;

  return (
    <div className={paddingClass || undefined}>
      <div className={`relative ${className}`} ref={wrapRef}>
        <div className="relative group">
          <input
            aria-activedescendant={
              flatNavTargets.length > 0
                ? `${listboxId}-opt-${String(activeIndex)}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showPanel}
            autoComplete="off"
            className="placeholder:translate-x-2 w-full rounded-xl border border-zk-border bg-zk-base/90 py-3 pl-10 pr-10 font-zk-sans text-sm text-zk-text backdrop-blur-sm transition-colors duration-200 placeholder:text-zk-muted/55 hover:border-zk-indigo/25 focus:border-zk-indigo/40 focus:bg-zk-elevated/80 focus:outline-none focus:ring-2 focus:ring-zk-indigo/35"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={handleFocus}
            onKeyDown={onKeyDown}
            placeholder="Search projects and credentials..."
            ref={inputRef}
            role="combobox"
            type="search"
            value={query}
          />
          <div className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-zk-indigo/90 transition-opacity duration-200 group-focus-within:bg-zk-indigo">
            <Search className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
          </div>
          {globalSearchIndexLoading && encryptionKey ? (
            <div
              aria-hidden
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zk-indigo"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : null}

          {showPanel ? (
            <div
              className={`absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto rounded-xl border border-zk-border bg-zk-elevated/98 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl custom-scrollbar ${
                variant === "sidebar" || variant === "mobile"
                  ? "z-[120]"
                  : "z-[200]"
              }`}
              id={listboxId}
              onMouseDown={(e) => e.preventDefault()}
              role="listbox"
            >
              {globalSearchIndexLoading &&
              tokens.length > 0 &&
              encryptionKey ? (
                <div className="flex items-center gap-2 px-3 py-2 font-zk-sans text-xs text-zk-muted">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zk-indigo" />
                  Syncing your vault for search…
                </div>
              ) : null}

              {tokens.length === 0 ? (
                <div className="px-3 py-2.5 font-zk-sans text-xs text-zk-muted">
                  Type to find a project or anything in your saved credentials.
                </div>
              ) : null}

              {showHintRow ? (
                <button
                  className="w-full border-b border-zk-border px-3 py-2.5 text-left font-zk-sans text-sm text-zk-cyan/90 transition-colors hover:bg-zk-base/70"
                  onClick={() => {
                    openMasterPasswordModal();
                    closePanel();
                  }}
                  type="button"
                >
                  Unlock your vault to include keys, secrets, and notes in
                  search.
                </button>
              ) : null}

              {tokens.length > 0 && projectQuickHits.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 pb-1 pt-2 font-zk-mono text-[10px] font-medium uppercase tracking-wider text-zk-muted">
                    Projects
                  </div>
                  {projectQuickHits.map((p) => {
                    flatCursor += 1;
                    const idx = flatCursor;
                    const selected = idx === activeIndex;
                    return (
                      <button
                        aria-selected={selected}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left font-zk-sans text-sm transition-colors ${
                          selected
                            ? "bg-zk-indigo/20 text-zk-text"
                            : "text-zk-text/90 hover:bg-zk-base/80"
                        }`}
                        id={`${listboxId}-opt-${String(idx)}`}
                        key={p.id}
                        onClick={() => goProject(p.id)}
                        role="option"
                        type="button"
                      >
                        <Layout
                          className="h-3.5 w-3.5 shrink-0 text-zk-indigo"
                          strokeWidth={1.5}
                        />
                        <span className="truncate">{p.projectName}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {tokens.length > 0 &&
              encryptionKey &&
              !globalSearchIndexLoading &&
              credentialRows.length === 0 &&
              projectQuickHits.length === 0 ? (
                <div className="px-3 py-3 font-zk-sans text-sm text-zk-muted">
                  No matches yet. Try another word or check spelling.
                </div>
              ) : null}

              {tokens.length > 0 &&
              encryptionKey &&
              credentialRows.length > 0 ? (
                <div className="border-t border-zk-border py-1">
                  <div className="px-3 pb-1 pt-2 font-zk-mono text-[10px] font-medium uppercase tracking-wider text-zk-muted">
                    Credentials
                  </div>
                  {credentialRows.map(({ cred, projectName }) => {
                    flatCursor += 1;
                    const idx = flatCursor;
                    const selected = idx === activeIndex;
                    const cat = categoryLabel(cred.category);
                    const isPriorityProject =
                      Boolean(prioritizeProjectId) &&
                      cred.projectId === prioritizeProjectId;
                    return (
                      <button
                        aria-selected={selected}
                        className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left font-zk-sans text-sm transition-colors ${
                          selected
                            ? "bg-zk-indigo/20 text-zk-text"
                            : "text-zk-text/90 hover:bg-zk-base/80"
                        }`}
                        id={`${listboxId}-opt-${String(idx)}`}
                        key={cred.id}
                        onClick={() => goCredential(cred.projectId, cred.id)}
                        role="option"
                        type="button"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Key
                            className="h-3.5 w-3.5 shrink-0 text-zk-cyan/85"
                            strokeWidth={1.5}
                          />
                          <span className="truncate font-medium">
                            {cred.serviceName}
                          </span>
                          {isPriorityProject ? (
                            <span className="shrink-0 rounded bg-zk-indigo/20 px-1.5 py-0.5 font-zk-mono text-[10px] font-semibold uppercase tracking-wide text-zk-indigo">
                              This project
                            </span>
                          ) : null}
                        </span>
                        <span className="flex min-w-0 items-center gap-1 pl-6 font-zk-sans text-xs text-zk-muted">
                          <Folder
                            className="h-3 w-3 shrink-0 opacity-70"
                            strokeWidth={1.5}
                          />
                          <span className="truncate">
                            {projectName || "Project"}
                            {cat ? ` · ${cat}` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchBar;

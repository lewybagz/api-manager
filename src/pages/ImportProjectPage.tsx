import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import useAuthStore from "../stores/authStore";
import useCredentialStore from "../stores/credentialStore";
import useProjectStore, { type ProjectStatus } from "../stores/projectStore";
import {
  analyzeCommentHints,
  baseName,
  buildEffectiveRoleMap,
  combinedCommentHint,
  isLikelyKey,
  isLikelySecret,
  parseEnvWithComments,
  type EntryRole,
  type RoleMapping,
} from "../utils/parseEnvImport";

const CATEGORY_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Database", value: "database" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "DevOps", value: "devops" },
  { label: "Mobile", value: "mobile" },
  { label: "Analytics", value: "analytics" },
  { label: "Other", value: "other" },
];

const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  "active",
  "planned",
  "paused",
  "completed",
  "archived",
];

const ImportProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { encryptionKey, masterPasswordSet, openMasterPasswordModal, user } =
    useAuthStore();
  const addProject = useProjectStore((s) => s.addProject);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const addCredential = useCredentialStore((s) => s.addCredential);

  const [projectName, setProjectName] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("active");
  const [credentialCategory, setCredentialCategory] = useState<string>("none");
  const [categoryByKey, setCategoryByKey] = useState<Record<string, string>>(
    {}
  );
  const [envText, setEnvText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [roleMap, setRoleMap] = useState<RoleMapping>({});
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [importOutcome, setImportOutcome] = useState<null | {
    failCount: number;
    mode: "create" | "update";
    projectId: string;
    successCount: number;
  }>(null);

  const parsed = useMemo(() => parseEnvWithComments(envText), [envText]);
  const total = parsed.length;

  const parsedKeysSig = useMemo(
    () => parsed.map((p) => p.key).join("\0"),
    [parsed]
  );

  React.useEffect(() => {
    void fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setCategoryByKey((prev) => {
      const next: Record<string, string> = {};
      for (const p of parsed) {
        next[p.key] = prev[p.key] ?? credentialCategory;
      }
      return next;
    });
  // parsedKeysSig tracks key set changes; omit `parsed` to avoid resetting on value-only edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: sync categories when keys or global default change
  }, [parsedKeysSig, credentialCategory]);

  const existingProjectByName = useMemo(() => {
    const name = projectName.trim();
    if (!name) return undefined;
    return projects.find((p) => p.projectName.trim() === name);
  }, [projects, projectName]);

  const canImport =
    Boolean(user?.uid) &&
    masterPasswordSet &&
    Boolean(encryptionKey) &&
    total > 0 &&
    (importMode === "create"
      ? projectName.trim().length >= 2
      : Boolean(selectedProjectId)) &&
    Object.values(roleMap).some((m) => m.role !== "ignore");

  React.useEffect(() => {
    const nextMap: RoleMapping = {};
    for (const entry of parsed) {
      const hintText = [entry.leadingComment, entry.inlineComment]
        .filter(Boolean)
        .join("\n");
      const { preferKey, preferSecret } = analyzeCommentHints(hintText);
      const nameSecret = isLikelySecret(entry.key);
      const nameKey = isLikelyKey(entry.key);
      let role: EntryRole;
      if (preferKey && !nameSecret) {
        role = "key";
      } else if (preferSecret && !nameKey) {
        role = "secret";
      } else if (nameSecret) {
        role = "secret";
      } else {
        role = "key";
      }
      nextMap[entry.key] = { role };
    }
    const keys = parsed.filter((e) => nextMap[e.key]?.role === "key");
    for (const entry of parsed) {
      if (nextMap[entry.key]?.role !== "secret") continue;
      const b = baseName(entry.key);
      const candidates = keys.filter((k) => {
        const kb = baseName(k.key);
        return kb === b;
      });
      const pick =
        candidates.find((c) => isLikelyKey(c.key)) || candidates[0] || keys[0];
      if (pick) {
        nextMap[entry.key].attachTo = pick.key;
      }
    }
    setRoleMap(nextMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const applyCategoryToAll = useCallback(() => {
    setCategoryByKey((prev) => {
      const next = { ...prev };
      for (const p of parsed) {
        next[p.key] = credentialCategory;
      }
      return next;
    });
  }, [parsed, credentialCategory]);

  const resetImportForm = useCallback((keepProjectTarget: boolean) => {
    setEnvText("");
    setCredentialCategory("none");
    setCategoryByKey({});
    setRoleMap({});
    setImportOutcome(null);
    setProjectName("");
    setProjectStatus("active");
    if (!keepProjectTarget) {
      setImportMode("create");
      setSelectedProjectId("");
    }
  }, []);

  const handleRequireUnlock = useCallback(() => {
    if (!masterPasswordSet || !encryptionKey) {
      toast.info("Unlock required", {
        description:
          "Enter your master password to enable credential encryption.",
      });
      openMasterPasswordModal();
      return true;
    }
    return false;
  }, [masterPasswordSet, encryptionKey, openMasterPasswordModal]);

  const handleImport = useCallback(async () => {
    if (handleRequireUnlock()) return;
    if (!user?.uid) {
      toast.error("Not signed in", {
        description: "Please sign in to import.",
      });
      return;
    }
    if (parsed.length === 0) {
      toast.error("No credentials detected", {
        description: "Paste a .env with at least one KEY=VALUE.",
      });
      return;
    }

    const effectiveMap = buildEffectiveRoleMap(parsed, roleMap);
    for (const [k, m] of Object.entries(effectiveMap)) {
      if (m.role === "secret") {
        if (!m.attachTo || effectiveMap[m.attachTo]?.role !== "key") {
          toast.error("Invalid secret mapping", {
            description: `Secret ${k} must attach to a Key entry.`,
          });
          return;
        }
      }
    }

    setIsImporting(true);
    try {
      let projectId: string | null = null;
      if (importMode === "create") {
        if (!projectName.trim()) {
          toast.error("Project name required");
          return;
        }
        if (existingProjectByName) {
          setImportMode("update");
          setSelectedProjectId(existingProjectByName.id);
          toast.info("Project exists", {
            description:
              "Switched to Update Existing and selected the project. Click import again to proceed.",
          });
          return;
        }
        projectId = await addProject({
          projectName: projectName.trim(),
          status: projectStatus,
          userId: user.uid,
        });
        if (!projectId) {
          throw new Error("Failed to create project");
        }
      } else {
        if (!selectedProjectId) {
          toast.error("Select a project to update");
          return;
        }
        projectId = selectedProjectId;
      }

      let successCount = 0;
      let failCount = 0;

      const keyEntries = parsed.filter(
        (e) => effectiveMap[e.key]?.role === "key"
      );
      const secretEntries = parsed.filter(
        (e) => effectiveMap[e.key]?.role === "secret"
      );

      for (const keyEntry of keyEntries) {
        const mappedSecrets = secretEntries.filter(
          (s) => effectiveMap[s.key]?.attachTo === keyEntry.key
        );
        const chosenSecret = mappedSecrets[0];
        const compiledNotes = chosenSecret
          ? `${chosenSecret.key}=apiSecret`
          : undefined;
        const serviceName = keyEntry.key;
        const cat =
          (categoryByKey[keyEntry.key] ?? credentialCategory) || "none";
        try {
          const payload = {
            apiKey: keyEntry.value.trim(),
            apiSecret: chosenSecret
              ? chosenSecret.value.trim() === ""
                ? undefined
                : chosenSecret.value.trim()
              : undefined,
            category: cat,
            notes: compiledNotes,
            serviceName,
          } as const;
          const id = await addCredential(projectId, payload as any);
          if (id) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }

      toast.success("Import complete", {
        description: `${successCount} imported, ${failCount} failed.`,
      });
      setEnvText("");
      if (successCount > 0 && projectId) {
        setImportOutcome({
          failCount,
          mode: importMode,
          projectId,
          successCount,
        });
      } else {
        setImportOutcome(null);
      }
    } catch (e) {
      toast.error("Import failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsImporting(false);
    }
  }, [
    addProject,
    addCredential,
    parsed,
    projectName,
    user,
    projectStatus,
    credentialCategory,
    categoryByKey,
    handleRequireUnlock,
    importMode,
    selectedProjectId,
    existingProjectByName,
    roleMap,
  ]);

  const fieldClass =
    "w-full rounded-xl border border-zk-border bg-zk-base/80 px-4 py-2.5 font-zk-sans text-sm text-zk-text placeholder:text-zk-muted/50 focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30";
  const compactSelectClass =
    "rounded-lg border border-zk-border bg-zk-base/80 px-2 py-1.5 font-zk-sans text-sm text-zk-text focus:border-zk-indigo/40 focus:outline-none focus:ring-2 focus:ring-zk-indigo/30";

  const categorySelectForKey = (envKey: string) => (
    <select
      className={`${compactSelectClass} min-w-[7.5rem]`}
      onChange={(e) => {
        const v = e.target.value;
        setCategoryByKey((prev) => ({ ...prev, [envKey]: v }));
      }}
      value={categoryByKey[envKey] ?? credentialCategory}
    >
      {CATEGORY_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-transparent font-zk-sans text-zk-text">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Import project from .env
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zk-muted sm:text-base">
            Create a project and import credentials by pasting a .env file.
            Comments above a line or at the end of a line (when the value is
            not quoted) are read as hints only.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-zk-border bg-zk-elevated/35 p-5 backdrop-blur-xl sm:p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zk-muted">
              Action
            </label>
            <select
              className={`${fieldClass} max-w-sm`}
              onChange={(e) => {
                setImportMode(e.target.value as "create" | "update");
              }}
              value={importMode}
            >
              <option value="create">Create new project</option>
              <option value="update">Update existing project</option>
            </select>
          </div>

          {importMode === "create" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zk-muted">
                  Project name
                </label>
                <input
                  className={fieldClass}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                  }}
                  placeholder="e.g., Acme App"
                  value={projectName}
                />
                {existingProjectByName ? (
                  <div className="mt-2 text-xs leading-relaxed text-amber-200/90">
                    A project with this name already exists. Import will switch
                    you to update mode and select it.
                  </div>
                ) : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zk-muted">
                  Project status
                </label>
                <select
                  className={fieldClass}
                  onChange={(e) => {
                    setProjectStatus(e.target.value as ProjectStatus);
                  }}
                  value={projectStatus}
                >
                  {PROJECT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="mb-2 block text-sm font-medium text-zk-muted">
                  Default category (new rows)
                </label>
                <select
                  className={fieldClass}
                  onChange={(e) => {
                    setCredentialCategory(e.target.value);
                  }}
                  value={credentialCategory}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  className="w-full rounded-lg border border-zk-border bg-zk-base/60 px-3 py-2 text-xs font-medium text-zk-text transition-colors hover:border-zk-indigo/35 hover:bg-zk-indigo/10 disabled:opacity-40"
                  disabled={parsed.length === 0}
                  onClick={() => {
                    applyCategoryToAll();
                  }}
                  type="button"
                >
                  Apply default to all rows
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zk-muted">
                  Project
                </label>
                <select
                  className={fieldClass}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                  }}
                  value={selectedProjectId}
                >
                  <option value="">Choose a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="mb-2 block text-sm font-medium text-zk-muted">
                  Default category (new rows)
                </label>
                <select
                  className={fieldClass}
                  onChange={(e) => {
                    setCredentialCategory(e.target.value);
                  }}
                  value={credentialCategory}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  className="w-full rounded-lg border border-zk-border bg-zk-base/60 px-3 py-2 text-xs font-medium text-zk-text transition-colors hover:border-zk-indigo/35 hover:bg-zk-indigo/10 disabled:opacity-40"
                  disabled={parsed.length === 0}
                  onClick={() => {
                    applyCategoryToAll();
                  }}
                  type="button"
                >
                  Apply default to all rows
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-zk-muted">
              .env content
            </label>
            <textarea
              className={`${fieldClass} min-h-[220px] resize-y font-zk-mono text-[13px] leading-relaxed`}
              onChange={(e) => {
                setEnvText(e.target.value);
              }}
              placeholder={`# example\nOPENAI_API_KEY=sk-...\nSTRIPE_SECRET=sk_live_...`}
              value={envText}
            />
            <div className="mt-2 text-xs text-zk-muted">
              {total} {total === 1 ? "entry" : "entries"} detected
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-zk-border bg-zk-base/60 px-4 py-2.5 text-sm font-medium text-zk-text transition-colors hover:border-zk-indigo/35 hover:bg-zk-indigo/10 disabled:opacity-50"
              disabled={!envText || isParsing}
              onClick={() => {
                setIsParsing(true);
                setTimeout(() => {
                  setIsParsing(false);
                }, 50);
              }}
              type="button"
            >
              Preview parse
            </button>
            <button
              className="rounded-xl bg-zk-indigo px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zk-indigo-hover disabled:opacity-50"
              disabled={!canImport || isImporting}
              onClick={() => void handleImport()}
              type="button"
            >
              {isImporting
                ? "Importing…"
                : importMode === "create"
                  ? "Create project and import"
                  : "Import credentials"}
            </button>
          </div>

          {importOutcome ? (
            <div className="rounded-xl border border-zk-indigo/30 bg-zk-elevated/50 p-4 sm:p-5">
              <p className="text-sm font-medium text-zk-text">
                {importOutcome.successCount}{" "}
                {importOutcome.successCount === 1 ? "credential" : "credentials"}{" "}
                saved
                {importOutcome.failCount > 0
                  ? ` · ${importOutcome.failCount} failed`
                  : ""}
                .
              </p>
              <p className="mt-1 text-xs text-zk-muted">
                Open the project to review, or import another file.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  className="rounded-xl bg-zk-indigo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zk-indigo-hover"
                  onClick={() => {
                    const id = importOutcome.projectId;
                    setImportOutcome(null);
                    void navigate(`/project/${id}`);
                  }}
                  type="button"
                >
                  Open project
                </button>
                <button
                  className="rounded-xl border border-zk-border bg-zk-base/60 px-4 py-2.5 text-sm font-medium text-zk-text transition-colors hover:border-zk-indigo/35 hover:bg-zk-indigo/10"
                  onClick={() => {
                    resetImportForm(importOutcome.mode === "update");
                  }}
                  type="button"
                >
                  Import more
                </button>
              </div>
            </div>
          ) : null}

          {total > 0 && (
            <div className="mt-2">
              <h2 className="mb-3 text-lg font-semibold tracking-[-0.02em] text-zk-text">
                Preview
              </h2>
              <div className="max-h-72 overflow-auto rounded-xl border border-zk-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-zk-border bg-zk-surface/70">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                        Env key
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                        Note
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                        Category
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                        Value (masked)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((p) => {
                      const role = roleMap[p.key]?.role ?? "key";
                      const hint = combinedCommentHint(p);
                      return (
                        <tr
                          className="border-t border-zk-border/80 first:border-t-0"
                          key={p.key}
                        >
                          <td className="px-3 py-2 font-zk-mono text-xs text-zk-text">
                            {p.key}
                          </td>
                          <td className="max-w-[10rem] px-3 py-2 text-xs text-zk-muted">
                            {hint || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {role === "key" ? (
                              categorySelectForKey(p.key)
                            ) : (
                              <span className="text-zk-muted/60">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-zk-mono text-xs text-zk-muted">
                            {"••••••" + p.value.slice(-4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <h3 className="mb-3 text-base font-semibold tracking-[-0.02em] text-zk-text">
                  Pair secrets with keys
                </h3>
                <div className="max-h-96 overflow-auto rounded-xl border border-zk-border">
                  <table className="w-full text-sm">
                    <thead className="border-b border-zk-border bg-zk-surface/70">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                          Env key
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                          Note
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                          Category
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                          Role
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zk-muted">
                          Attach to (secret)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((p) => {
                        const m = roleMap[p.key] ?? {
                          role: "key" as EntryRole,
                        };
                        const currentKeys = parsed.filter(
                          (e) => (roleMap[e.key]?.role ?? "key") === "key"
                        );
                        const hint = combinedCommentHint(p);
                        return (
                          <tr
                            className="border-t border-zk-border/80 first:border-t-0"
                            key={p.key}
                          >
                            <td className="px-3 py-2 font-zk-mono text-xs text-zk-text">
                              {p.key}
                            </td>
                            <td className="max-w-[9rem] px-3 py-2 text-xs text-zk-muted">
                              {hint || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {m.role === "key" ? (
                                categorySelectForKey(p.key)
                              ) : (
                                <span className="text-zk-muted/60">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                className={compactSelectClass}
                                onChange={(e) => {
                                  const role = e.target.value as EntryRole;
                                  setRoleMap((prev) => {
                                    const next = {
                                      ...prev,
                                      [p.key]: { ...(prev[p.key] ?? {}), role },
                                    } as RoleMapping;
                                    if (role !== "secret") {
                                      delete next[p.key].attachTo;
                                    } else {
                                      const firstKey = parsed.find(
                                        (x) =>
                                          (next[x.key]?.role ?? "key") === "key"
                                      );
                                      if (firstKey)
                                        next[p.key].attachTo =
                                          next[p.key].attachTo ?? firstKey.key;
                                    }
                                    return next;
                                  });
                                }}
                                value={m.role}
                              >
                                <option value="key">Key</option>
                                <option value="secret">Secret</option>
                                <option value="ignore">Ignore</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              {m.role === "secret" ? (
                                <select
                                  className={compactSelectClass}
                                  onChange={(e) => {
                                    const attachTo = e.target.value;
                                    setRoleMap((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...(prev[p.key] ?? {
                                          role: "secret" as EntryRole,
                                        }),
                                        attachTo,
                                        role: "secret",
                                      },
                                    }));
                                  }}
                                  value={m.attachTo ?? ""}
                                >
                                  {currentKeys.map((k) => (
                                    <option key={k.key} value={k.key}>
                                      {k.key}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-zk-muted/60">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProjectPage;

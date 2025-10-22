import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import useAuthStore from "../stores/authStore";
import useCredentialStore from "../stores/credentialStore";
import useProjectStore, { type ProjectStatus } from "../stores/projectStore";

interface ParsedEnvEntry {
  key: string;
  value: string;
}

type EntryRole = "key" | "secret" | "ignore";

type RoleMapping = Record<string, { attachTo?: string; role: EntryRole }>;

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

const stripQuotes = (text: string): string => {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseEnv = (input: string): ParsedEnvEntry[] => {
  const lines = input.split(/\r?\n/);
  const result: ParsedEnvEntry[] = [];
  const seen = new Map<string, number>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#") || line.startsWith(";")) continue; // comment lines
    const withoutExport = line.startsWith("export ") ? line.slice(7) : line;

    // Split on first '=' only
    const eqIndex = withoutExport.indexOf("=");
    if (eqIndex === -1) continue;
    const key = withoutExport.slice(0, eqIndex).trim();
    let value = withoutExport.slice(eqIndex + 1);

    // Remove inline comments when not quoted
    const hasQuotes = /(^\s*['"]).*(['"]\s*$)/.test(value.trim());
    if (!hasQuotes) {
      const hashIndex = value.indexOf(" #");
      if (hashIndex !== -1) value = value.slice(0, hashIndex);
    }

    const cleaned = stripQuotes(value);
    if (!key) continue;
    if (cleaned.length === 0) continue;

    // de-duplicate, keep last occurrence
    if (seen.has(key)) {
      const idx = seen.get(key)!;
      result[idx] = { key, value: cleaned };
    } else {
      seen.set(key, result.length);
      result.push({ key, value: cleaned });
    }
  }
  return result;
};

const isLikelySecret = (envKey: string): boolean => {
  const u = envKey.toUpperCase();
  return (
    u.includes("SECRET") ||
    u.includes("PRIVATE") ||
    u.endsWith("_PASSWORD") ||
    u.endsWith("_PASS") ||
    u.endsWith("_TOKEN") ||
    u.endsWith("_CLIENT_SECRET")
  );
};

const isLikelyKey = (envKey: string): boolean => {
  const u = envKey.toUpperCase();
  return (
    u.endsWith("_KEY") ||
    u.endsWith("_API_KEY") ||
    u.endsWith("_ACCESS_KEY") ||
    u.includes("PUBLIC_KEY") ||
    u.includes("API_KEY")
  );
};

const baseName = (envKey: string): string => {
  const u = envKey.toUpperCase();
  return u
    .replace(/(_CLIENT)?_SECRET$/, "")
    .replace(/(_API)?_SECRET$/, "")
    .replace(/_PASSWORD$/, "")
    .replace(/_PASS$/, "")
    .replace(/_TOKEN$/, "")
    .replace(/_API_KEY$/, "")
    .replace(/_ACCESS_KEY$/, "")
    .replace(/_KEY$/, "")
    .replace(/_PUBLIC$/, "")
    .replace(/_ID$/, "");
};

const buildEffectiveRoleMap = (
  entries: ParsedEnvEntry[],
  existing: RoleMapping
): RoleMapping => {
  const map: RoleMapping = { ...existing };
  // Ensure every entry has a role
  for (const e of entries) {
    if (!map[e.key]) {
      const secret = isLikelySecret(e.key);
      const keyLike = isLikelyKey(e.key);
      map[e.key] = { role: secret ? "secret" : keyLike ? "key" : "key" };
    }
  }
  // Ensure every secret is attached to some key with matching base if possible
  const keys = entries.filter((x) => (map[x.key]?.role ?? "key") === "key");
  for (const e of entries) {
    const m = map[e.key];
    if (!m || m.role !== "secret") continue;
    if (m.attachTo && map[m.attachTo]?.role === "key") continue;
    const b = baseName(e.key);
    const candidates = keys.filter((k) => baseName(k.key) === b);
    const pick =
      candidates.find((c) => isLikelyKey(c.key)) || candidates[0] || keys[0];
    if (pick) {
      map[e.key].attachTo = pick.key;
    }
  }
  return map;
};

const ImportProjectPage: React.FC = () => {
  const { encryptionKey, masterPasswordSet, openMasterPasswordModal, user } =
    useAuthStore();
  const addProject = useProjectStore((s) => s.addProject);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const addCredential = useCredentialStore((s) => s.addCredential);

  const [projectName, setProjectName] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("active");
  const [credentialCategory, setCredentialCategory] = useState<string>("none");
  const [envText, setEnvText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [roleMap, setRoleMap] = useState<RoleMapping>({});
  const [importMode, setImportMode] = useState<"create" | "update">("create");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const parsed = useMemo(() => parseEnv(envText), [envText]);
  const total = parsed.length;

  // Load projects for update mode
  React.useEffect(() => {
    void fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // at least one non-ignored item
    Object.values(roleMap).some((m) => m.role !== "ignore");

  // Initialize role mapping heuristically whenever parsed changes
  React.useEffect(() => {
    const nextMap: RoleMapping = {};
    for (const entry of parsed) {
      const secret = isLikelySecret(entry.key);
      const keyLike = isLikelyKey(entry.key);
      nextMap[entry.key] = { role: secret ? "secret" : "key" };
      if (!secret && !keyLike) {
        // default ambiguous to key
        nextMap[entry.key].role = "key";
      }
    }
    // Attach secrets to likely keys with same base
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

    // Build a consistent role map snapshot and validate
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

      // Build credentials from mapping: create only for entries marked as 'key'
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
        const serviceName = keyEntry.key; // Save full env key as service name
        try {
          const payload = {
            apiKey: keyEntry.value.trim(),
            apiSecret: chosenSecret
              ? chosenSecret.value.trim() === ""
                ? undefined
                : chosenSecret.value.trim()
              : undefined,
            category: credentialCategory || "none",
            notes: compiledNotes,
            serviceName,
          } as const;
          const id = await addCredential(projectId, payload as any);
          if (id) successCount++;
          else failCount++;
        } catch (e) {
          failCount++;
        }
      }

      toast.success("Import complete", {
        description: `${successCount} imported, ${failCount} failed.`,
      });
      setEnvText("");
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
    handleRequireUnlock,
    importMode,
    selectedProjectId,
    existingProjectByName,
    roleMap,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-blue-light to-brand-dark-secondary">
      <div className="p-4 sm:p-6 lg:p-8 text-brand-light max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl">Import Project from .env</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create a project and import its credentials by pasting a .env file.
            Comments are ignored.
          </p>
        </div>

        <div className="space-y-6 bg-brand-dark-secondary/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
          <div>
            <label className="block text-sm mb-2">Action</label>
            <select
              className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-2 text-white max-w-sm"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Project Name</label>
                <input
                  className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-2 text-white"
                  onChange={(e) => {
                    setProjectName(e.target.value);
                  }}
                  placeholder="e.g., Acme App"
                  value={projectName}
                />
                {existingProjectByName ? (
                  <div className="text-xs text-amber-400 mt-1">
                    A project with this name exists. Choosing Import will switch
                    to Update.
                  </div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm mb-2">Project Status</label>
                <select
                  className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-2 text-white"
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
              <div>
                <label className="block text-sm mb-2">
                  Credential Category (applied to all)
                </label>
                <select
                  className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-2 text-white"
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
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Select Project</label>
                <select
                  className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-2 text-white"
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
              <div>
                <label className="block text-sm mb-2">
                  Credential Category (applied to all)
                </label>
                <select
                  className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-2 text-white"
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
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm mb-2">.env Content</label>
            <textarea
              className="w-full rounded-md border border-gray-700/50 bg-gray-800/70 p-3 text-white min-h-[220px]"
              onChange={(e) => {
                setEnvText(e.target.value);
              }}
              placeholder={`# Comments supported\nOPENAI_API_KEY=sk-...\nSTRIPE_SECRET=sk_live_...`}
              value={envText}
            />
            <div className="mt-2 text-xs text-gray-400">
              Detected {total} entries
            </div>
          </div>

          <div className="bg-transparent">
            <button
              className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-md disabled:opacity-50 mr-2"
              disabled={!envText || isParsing}
              onClick={() => {
                setIsParsing(true);
                // Just trigger parse via state update; already memoized
                setTimeout(() => {
                  setIsParsing(false);
                }, 50);
              }}
              type="button"
            >
              Preview Parse
            </button>
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
              disabled={!canImport || isImporting}
              onClick={() => void handleImport()}
              type="button"
            >
              {isImporting ? "Importing..." : "Create Project & Import"}
            </button>
          </div>

          {total > 0 && (
            <div className="mt-4">
              <h2 className="text-lg mb-2">Preview</h2>
              <div className="max-h-64 overflow-auto border border-gray-800/60 rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/60">
                    <tr>
                      <th className="text-left p-2">Env Key</th>
                      <th className="text-left p-2">
                        Service (will be saved as)
                      </th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Value (masked)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((p) => (
                      <tr className="border-t border-gray-800/50" key={p.key}>
                        <td className="p-2 font-mono text-gray-300">{p.key}</td>
                        <td className="p-2">{p.key}</td>
                        <td className="p-2 capitalize">
                          {credentialCategory || "none"}
                        </td>
                        <td className="p-2 font-mono text-gray-400">
                          {"••••••" + p.value.slice(-4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pairing UI */}
              <div className="mt-6">
                <h3 className="text-md mb-2">Pair secrets with keys</h3>
                <div className="max-h-72 overflow-auto border border-gray-800/60 rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/60">
                      <tr>
                        <th className="text-left p-2">Env Key</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Attach To (if Secret)</th>
                        <th className="text-left p-2">Service</th>
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
                        return (
                          <tr
                            className="border-t border-gray-800/50"
                            key={p.key}
                          >
                            <td className="p-2 font-mono text-gray-300">
                              {p.key}
                            </td>
                            <td className="p-2">
                              <select
                                className="bg-gray-800/70 border border-gray-700/50 rounded-md text-white px-2 py-1"
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
                                      // ensure attach target exists
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
                            <td className="p-2">
                              {m.role === "secret" ? (
                                <select
                                  className="bg-gray-800/70 border border-gray-700/50 rounded-md text-white px-2 py-1"
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
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="p-2">{p.key}</td>
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

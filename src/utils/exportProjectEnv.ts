import {
  credentialCategoryLabel,
  normalizeCredentialCategory,
} from "../constants/credentialCategories";
import type { DecryptedCredential } from "../stores/credentialStore";

export type ProjectEnvExportScope = "all" | string;

/** Escape a value for a KEY=value line in a .env-style file. */
export function escapeEnvValue(value: string): string {
  const needsQuotes =
    value === "" ||
    /[\s#'"`]/.test(value) ||
    /[=]/.test(value) ||
    value.includes("\n") ||
    value.includes("\r");
  if (!needsQuotes) {
    return value.replace(/\$/g, "\\$");
  }
  const inner = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
  return `"${inner}"`;
}

/** Matches import flow: `OTHER_KEY=apiSecret` in notes → secret env var name. */
export function resolveSecretEnvVarName(
  serviceName: string,
  notes?: string
): string {
  const t = notes?.trim();
  if (t) {
    const m = t.match(/^([^=]+)=apiSecret\s*$/);
    const name = m?.[1]?.trim();
    if (name && name.length > 0) return name;
  }
  return `${serviceName}_SECRET`;
}

const slugifyFilenamePart = (part: string, maxLen = 40): string =>
  part
    .trim()
    .toLowerCase()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen)

export function filterCredentialsForExport(
  credentials: DecryptedCredential[],
  scope: ProjectEnvExportScope
): DecryptedCredential[] {
  if (scope === "all") return credentials
  const target = normalizeCredentialCategory(scope)
  return credentials.filter(
    (c) => normalizeCredentialCategory(c.category) === target
  )
}

export function projectEnvFilename(
  projectName: string,
  scope: ProjectEnvExportScope = "all"
): string {
  const base = slugifyFilenamePart(projectName, 80)
  const projectSlug = base || "project"
  if (scope === "all") return `${projectSlug}.env`
  const categorySlug = slugifyFilenamePart(scope, 24) || "category"
  return `${projectSlug}.${categorySlug}.env`
}

export function buildProjectEnvFileContent(
  credentials: DecryptedCredential[],
  options?: { categoryScope?: ProjectEnvExportScope }
): string {
  const sorted = [...credentials].sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName, undefined, {
      sensitivity: "base",
    })
  );

  const lines: string[] = ["# Keys for this project — treat like a password."]

  const scope = options?.categoryScope
  if (scope && scope !== "all") {
    lines.push(
      `# Category: ${credentialCategoryLabel(scope)}`,
    )
  }

  lines.push("")

  for (const c of sorted) {
    lines.push(`${c.serviceName}=${escapeEnvValue(c.apiKey)}`);
    if (c.apiSecret && c.apiSecret.length > 0) {
      const secretKey = resolveSecretEnvVarName(c.serviceName, c.notes);
      lines.push(`${secretKey}=${escapeEnvValue(c.apiSecret)}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

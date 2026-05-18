import type { DecryptedCredential } from "../stores/credentialStore";

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

export function projectEnvFilename(projectName: string): string {
  const base = projectName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base || "project"}.env`;
}

export function buildProjectEnvFileContent(
  credentials: DecryptedCredential[]
): string {
  const sorted = [...credentials].sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName, undefined, {
      sensitivity: "base",
    })
  );

  const lines: string[] = [
    "# Keys for this project — treat like a password.",
    "",
  ];

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

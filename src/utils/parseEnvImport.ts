export interface ParsedEnvEntry {
  inlineComment?: string;
  key: string;
  leadingComment?: string;
  value: string;
}

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

const isCommentOnlyLine = (trimmed: string): boolean => {
  if (!trimmed) return false;
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith(";") ||
    trimmed.startsWith("//")
  );
};

const stripLineCommentPrefix = (raw: string): string => {
  let s = raw.trim();
  if (s.startsWith("//")) return s.slice(2).trim();
  if (s.startsWith("#")) return s.slice(1).trim();
  if (s.startsWith(";")) return s.slice(1).trim();
  return s;
};

/** Keyword hints from leading / inline comments (no raw values). */
export function analyzeCommentHints(text: string): {
  preferKey: boolean;
  preferSecret: boolean;
} {
  const t = text.toLowerCase();
  const preferSecret =
    /\b(secret|private|password|passwd|token|credential)\b/.test(t) ||
    t.includes("client_secret") ||
    t.includes("client secret");
  const preferKey =
    /\b(api\s*key|public|publishable|pk_|not\s*secret|non-secret|publishable\s*key)\b/.test(
      t
    );
  return { preferKey, preferSecret };
}

export function isLikelySecret(envKey: string): boolean {
  const u = envKey.toUpperCase();
  return (
    u.includes("SECRET") ||
    u.includes("PRIVATE") ||
    u.endsWith("_PASSWORD") ||
    u.endsWith("_PASS") ||
    u.endsWith("_TOKEN") ||
    u.endsWith("_CLIENT_SECRET")
  );
}

export function isLikelyKey(envKey: string): boolean {
  const u = envKey.toUpperCase();
  return (
    u.endsWith("_KEY") ||
    u.endsWith("_API_KEY") ||
    u.endsWith("_ACCESS_KEY") ||
    u.includes("PUBLIC_KEY") ||
    u.includes("API_KEY")
  );
}

export function baseName(envKey: string): string {
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
}

/**
 * Parse .env text: KEY=value lines, preceding comment blocks, inline comments
 * (unquoted values only), export prefix, dedupe by key (last wins).
 */
export function parseEnvWithComments(input: string): ParsedEnvEntry[] {
  const lines = input.split(/\r?\n/);
  const result: ParsedEnvEntry[] = [];
  const seen = new Map<string, number>();
  const commentBuffer: string[] = [];

  const flushCommentBuffer = (): string | undefined => {
    if (commentBuffer.length === 0) return undefined;
    const joined = commentBuffer
      .map(stripLineCommentPrefix)
      .filter(Boolean)
      .join("\n");
    commentBuffer.length = 0;
    return joined || undefined;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isCommentOnlyLine(line)) {
      commentBuffer.push(line);
      continue;
    }

    const withoutExport = line.startsWith("export ") ? line.slice(7).trim() : line;
    const eqIndex = withoutExport.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = withoutExport.slice(0, eqIndex).trim();
    let value = withoutExport.slice(eqIndex + 1);
    let inlineComment: string | undefined;

    const hasQuotes = /(^\s*['"]).*(['"]\s*$)/.test(value.trim());
    if (!hasQuotes) {
      const idxHash = value.indexOf(" #");
      const idxSlash = value.indexOf(" //");
      let cut = -1;
      if (idxHash !== -1 && idxSlash !== -1) {
        cut = Math.min(idxHash, idxSlash);
      } else if (idxHash !== -1) {
        cut = idxHash;
      } else if (idxSlash !== -1) {
        cut = idxSlash;
      }
      if (cut !== -1) {
        const tail = value.slice(cut).trim();
        inlineComment = tail
          .replace(/^\s*#\s*/, "")
          .replace(/^\s*\/\/\s*/, "")
          .trim();
        value = value.slice(0, cut);
      }
    }

    const cleaned = stripQuotes(value);
    if (!key || cleaned.length === 0) {
      flushCommentBuffer();
      continue;
    }

    const leadingComment = flushCommentBuffer();
    const entry: ParsedEnvEntry = {
      inlineComment,
      key,
      leadingComment,
      value: cleaned,
    };

    if (seen.has(key)) {
      const idx = seen.get(key)!;
      result[idx] = entry;
    } else {
      seen.set(key, result.length);
      result.push(entry);
    }
  }

  flushCommentBuffer();
  return result;
}

export function truncateHint(text: string | undefined, maxLen = 72): string {
  if (!text) return "";
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen - 1)}…`;
}

export function combinedCommentHint(entry: ParsedEnvEntry): string {
  const parts = [entry.leadingComment, entry.inlineComment].filter(Boolean);
  return truncateHint(parts.join(" · "));
}

export type EntryRole = "key" | "secret" | "ignore";

export type RoleMapping = Record<
  string,
  { attachTo?: string; role: EntryRole }
>;

export function buildEffectiveRoleMap(
  entries: ParsedEnvEntry[],
  existing: RoleMapping
): RoleMapping {
  const map: RoleMapping = { ...existing };
  for (const e of entries) {
    if (!map[e.key]) {
      const secret = isLikelySecret(e.key);
      const keyLike = isLikelyKey(e.key);
      map[e.key] = { role: secret ? "secret" : keyLike ? "key" : "key" };
    }
  }
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
}

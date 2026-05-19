import { API_BASE } from "@/config/paths";

type ApiPostOptions = {
  /** Firebase ID token; omit for public rate-limit routes. */
  token?: string | null;
};

/** Map `/api/...` to `${API_BASE}/...` (e.g. `/internal/zeker/api/...` on portfolio domain). */
export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/api/")) {
    return `${API_BASE}${normalized.slice(4)}`;
  }
  return `${API_BASE}${normalized}`;
}

export async function apiPostJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
  options: ApiPostOptions = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(resolveApiUrl(path), {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API ${path} failed (${res.status})`);
  }

  return (await res.json()) as TResponse;
}

export async function getIdTokenOrNull(): Promise<string | null> {
  const { auth } = await import("../firebase");
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

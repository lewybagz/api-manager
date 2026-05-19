/** Vite `base` without trailing slash, e.g. `/internal/zeker` */
export const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Same-origin API prefix when proxied through the portfolio domain */
export const API_BASE = `${APP_BASE}/api`;

export function appPath(segment: string): string {
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `${APP_BASE}${normalized}`;
}

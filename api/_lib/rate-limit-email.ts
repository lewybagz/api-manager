/** Matches client [sanitizeEmailForDocId](src/stores/rateLimitStore.ts). */
export function sanitizeEmailForDocId(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.replace(/[.@#$[\]/]/g, "_").toLowerCase();
}

export function dayKeyUtc(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

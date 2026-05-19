import type { VercelRequest, VercelResponse } from "@vercel/node";

export function methodNotAllowed(res: VercelResponse, allowed: string[]): void {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: "Method Not Allowed" });
}

export function jsonError(
  res: VercelResponse,
  status: number,
  message: string
): void {
  res.status(status).json({ error: message });
}

export function parseJsonBody<T extends Record<string, unknown>>(
  req: VercelRequest
): T | null {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as T;
  }
  return null;
}

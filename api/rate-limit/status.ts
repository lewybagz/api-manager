import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getFirestore } from "../_lib/firebase-admin";
import { jsonError, methodNotAllowed } from "../_lib/http";
import { sanitizeEmailForDocId } from "../_lib/rate-limit-email";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_MS = 15 * 60 * 1000;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const body =
    req.body && typeof req.body === "object"
      ? (req.body as { email?: string; maxAttempts?: number; lockoutMs?: number })
      : {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    jsonError(res, 400, "Email required");
    return;
  }

  const sanitizedEmail = sanitizeEmailForDocId(email);
  if (!sanitizedEmail) {
    res.status(200).json({ isRateLimited: false, remainingLockoutMs: 0 });
    return;
  }

  const maxAttempts =
    typeof body.maxAttempts === "number" ? body.maxAttempts : DEFAULT_MAX_ATTEMPTS;
  const lockoutMs =
    typeof body.lockoutMs === "number" ? body.lockoutMs : DEFAULT_LOCKOUT_MS;

  const db = getFirestore();
  const ref = db.collection("rateLimits").doc(sanitizedEmail);

  try {
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(200).json({ isRateLimited: false, remainingLockoutMs: 0 });
      return;
    }

    const data = snap.data() as {
      attempts?: number;
      lastAttempt?: { toMillis: () => number };
    };

    if (!data.lastAttempt) {
      res.status(200).json({ isRateLimited: false, remainingLockoutMs: 0 });
      return;
    }

    const lastAttemptMs = data.lastAttempt.toMillis();
    const attempts = data.attempts ?? 0;
    const lockoutExpiry = Date.now() - lockoutMs;
    const isRateLimited =
      attempts >= maxAttempts && lastAttemptMs > lockoutExpiry;
    const remainingLockoutMs = isRateLimited
      ? Math.max(0, lockoutMs - (Date.now() - lastAttemptMs))
      : 0;

    res.status(200).json({ isRateLimited, remainingLockoutMs });
  } catch (e) {
    console.error("rate-limit status error", e);
    jsonError(res, 500, "Internal error");
  }
}

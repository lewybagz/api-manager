import type { VercelRequest, VercelResponse } from "@vercel/node";

import { FieldValue, getFirestore } from "../_lib/firebase-admin";
import { jsonError, methodNotAllowed, parseJsonBody } from "../_lib/http";
import { sanitizeEmailForDocId } from "../_lib/rate-limit-email";

type ResetBody = { email?: string };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const body = parseJsonBody<ResetBody>(req);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    jsonError(res, 400, "Email required");
    return;
  }

  const sanitizedEmail = sanitizeEmailForDocId(email);
  if (!sanitizedEmail) {
    jsonError(res, 400, "Invalid email");
    return;
  }

  const db = getFirestore();
  const ref = db.collection("rateLimits").doc(sanitizedEmail);

  try {
    await ref.set({
      attempts: 0,
      lastAttempt: FieldValue.serverTimestamp(),
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("rate-limit reset error", e);
    jsonError(res, 500, "Internal error");
  }
}

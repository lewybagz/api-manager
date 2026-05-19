import type { VercelRequest, VercelResponse } from "@vercel/node";

import { FieldValue, getFirestore } from "../_lib/firebase-admin";
import { jsonError, methodNotAllowed, parseJsonBody } from "../_lib/http";
import { sanitizeEmailForDocId } from "../_lib/rate-limit-email";

type FailedBody = { email?: string };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const body = parseJsonBody<FailedBody>(req);
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
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        attempts: 1,
        lastAttempt: FieldValue.serverTimestamp(),
      });
    } else {
      const attempts = ((snap.data()?.attempts as number) ?? 0) + 1;
      await ref.update({
        attempts,
        lastAttempt: FieldValue.serverTimestamp(),
      });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("rate-limit failed-attempt error", e);
    jsonError(res, 500, "Internal error");
  }
}

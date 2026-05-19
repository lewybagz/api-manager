import type { VercelRequest, VercelResponse } from "@vercel/node";

import { FieldValue, getFirestore } from "../_lib/firebase-admin";
import { jsonError, methodNotAllowed, parseJsonBody } from "../_lib/http";
import { dayKeyUtc } from "../_lib/rate-limit-email";
import { verifyBearerToken } from "../_lib/verify-auth";

type DailyBody = {
  key?: string;
  limitPerDay?: number;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  const auth = await verifyBearerToken(req);
  if (!auth) {
    jsonError(res, 401, "Unauthorized");
    return;
  }

  const body = parseJsonBody<DailyBody>(req);
  const key = typeof body?.key === "string" ? body.key : "";
  const limitPerDay =
    typeof body?.limitPerDay === "number" ? body.limitPerDay : 3;
  if (!key) {
    jsonError(res, 400, "Missing key");
    return;
  }

  const db = getFirestore();
  const docId = `${key}:${dayKeyUtc()}`;
  const ref = db.collection("dailyLimits").doc(docId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, {
          count: 1,
          date: FieldValue.serverTimestamp(),
          uid: auth.uid,
        });
        return { ok: true, count: 1 };
      }
      const nextCount = ((snap.data()?.count as number) ?? 0) + 1;
      if (nextCount > limitPerDay) {
        return { ok: false, count: (snap.data()?.count as number) ?? 0 };
      }
      tx.update(ref, {
        count: nextCount,
        date: FieldValue.serverTimestamp(),
      });
      return { ok: true, count: nextCount };
    });
    res.status(200).json(result);
  } catch (e) {
    console.error("rate-limit daily error", e);
    jsonError(res, 500, "Failed to consume limit");
  }
}

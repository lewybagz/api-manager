import type { VercelRequest, VercelResponse } from "@vercel/node";

import { FieldValue, getFirestore } from "../_lib/firebase-admin";
import { jsonError, methodNotAllowed, parseJsonBody } from "../_lib/http";
import { verifyBearerToken } from "../_lib/verify-auth";

type MergeBody = {
  sourceTagId?: string;
  targetTagId?: string;
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

  const body = parseJsonBody<MergeBody>(req);
  const source = String(body?.sourceTagId ?? "");
  const target = String(body?.targetTagId ?? "");
  if (!source || !target || source === target) {
    jsonError(res, 400, "Invalid tag ids");
    return;
  }

  const db = getFirestore();
  const uid = auth.uid;
  const col = db.collection(`users/${uid}/passwords`);

  try {
    const snap = await col.get();
    let batch = db.batch();
    let batchOps = 0;

    const commitBatch = async () => {
      if (batchOps === 0) return;
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    };

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as { tagIds?: string[] };
      const tags = Array.isArray(data.tagIds) ? data.tagIds : [];
      if (!tags.includes(source)) continue;

      const next = Array.from(
        new Set(tags.filter((t) => t !== source).concat([target]))
      ).slice(0, 20);

      batch.update(docSnap.ref, {
        tagIds: next,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchOps++;
      if (batchOps >= 300) await commitBatch();
    }
    await commitBatch();

    const tagsRef = db.collection(`users/${uid}/tags`);
    const srcRef = tagsRef.doc(source);
    const tgtRef = tagsRef.doc(target);

    await db.runTransaction(async (tx) => {
      const [src, tgt] = await Promise.all([tx.get(srcRef), tx.get(tgtRef)]);
      const srcCount = (src.data()?.usageCount ?? 0) as number;
      const tgtCount = (tgt.data()?.usageCount ?? 0) as number;
      tx.update(tgtRef, {
        usageCount: tgtCount + srcCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.delete(srcRef);
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("merge-tags error", e);
    jsonError(res, 500, "Internal error");
  }
}

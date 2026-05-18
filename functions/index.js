import admin from "firebase-admin";
import * as functions from "firebase-functions";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const pw_consumeDailyLimit = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }
    const key = typeof data?.key === "string" ? data.key : "";
    const limitPerDay =
      typeof data?.limitPerDay === "number" ? data.limitPerDay : 3;
    if (!key) {
      throw new functions.https.HttpsError("invalid-argument", "Missing key");
    }

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const dayKey = `${y}-${m}-${d}`;
    const docId = `${key}:${dayKey}`;
    const ref = db.collection("dailyLimits").doc(docId);

    try {
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) {
          tx.set(ref, {
            count: 1,
            date: admin.firestore.FieldValue.serverTimestamp(),
            uid: context.auth.uid,
          });
          return { ok: true, count: 1 };
        }
        const count = (snap.data()?.count ?? 0) + 1;
        if (count > limitPerDay) {
          return { ok: false, count: snap.data()?.count ?? 0 };
        }
        tx.update(ref, {
          count,
          date: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { ok: true, count };
      });
      return result;
    } catch (e) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to consume limit"
      );
    }
  }
);

// OnWrite for passwords to maintain usageCount on tags
export const pw_passwords_onWrite = functions.firestore
  .document("users/{uid}/passwords/{id}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid as string;
    const before = (change.before.exists ? change.before.data() : null) as any;
    const after = (change.after.exists ? change.after.data() : null) as any;
    const beforeTags: string[] = Array.isArray(before?.tagIds) ? before.tagIds : [];
    const afterTags: string[] = Array.isArray(after?.tagIds) ? after.tagIds : [];
    const dec = beforeTags.filter((t) => !afterTags.includes(t));
    const inc = afterTags.filter((t) => !beforeTags.includes(t));
    const batch = db.batch();
    for (const id of dec) {
      const ref = db.doc(`users/${uid}/tags/${id}`);
      batch.set(ref, { usageCount: admin.firestore.FieldValue.increment(-1), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    for (const id of inc) {
      const ref = db.doc(`users/${uid}/tags/${id}`);
      batch.set(ref, { usageCount: admin.firestore.FieldValue.increment(1), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  });

// Callable to merge tags across passwords for a user
export const pw_mergeTags = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Auth required");
  const source = String(data?.sourceTagId || "");
  const target = String(data?.targetTagId || "");
  if (!source || !target || source === target) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid tag ids");
  }
  const col = db.collection(`users/${uid}/passwords`);
  const snap = await col.get();
  const batch = db.batch();
  let count = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as any;
    const tags: string[] = Array.isArray(data.tagIds) ? data.tagIds : [];
    if (tags.includes(source)) {
      const next = Array.from(new Set(tags.filter((t) => t !== source).concat([target]))).slice(0, 20);
      batch.update(docSnap.ref, { tagIds: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      count++;
      if (count % 300 === 0) {
        await batch.commit();
      }
    }
  }
  await batch.commit();
  // Adjust usage counts
  const tagsRef = db.collection(`users/${uid}/tags`);
  const [srcRef, tgtRef] = [tagsRef.doc(source), tagsRef.doc(target)];
  await db.runTransaction(async (tx) => {
    const [src, tgt] = await Promise.all([tx.get(srcRef), tx.get(tgtRef)]);
    const srcCount = (src.data()?.usageCount ?? 0) as number;
    const tgtCount = (tgt.data()?.usageCount ?? 0) as number;
    tx.update(tgtRef, { usageCount: tgtCount + srcCount, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.delete(srcRef);
  });
  return { ok: true };
});
import {
  doc,
  increment,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import { db } from "../firebase";

function normalizeTagIds(tagIds: string[] | undefined): string[] {
  return Array.isArray(tagIds) ? tagIds : [];
}

/**
 * Mirrors legacy Cloud Function `pw_passwords_onWrite` — adjusts tag usageCount
 * when password tagIds change.
 */
export async function syncTagUsageForPasswordChange(
  uid: string,
  beforeTagIds: string[] | undefined,
  afterTagIds: string[] | undefined,
  firestore: Firestore = db
): Promise<void> {
  const before = normalizeTagIds(beforeTagIds);
  const after = normalizeTagIds(afterTagIds);
  const dec = before.filter((t) => !after.includes(t));
  const inc = after.filter((t) => !before.includes(t));
  if (dec.length === 0 && inc.length === 0) return;

  const batch = writeBatch(firestore);
  for (const id of dec) {
    const ref = tagRef(firestore, uid, id);
    batch.set(
      ref,
      {
        usageCount: increment(-1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  for (const id of inc) {
    const ref = tagRef(firestore, uid, id);
    batch.set(
      ref,
      {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  await batch.commit();
}

function tagRef(firestore: Firestore, uid: string, tagId: string) {
  return doc(firestore, "users", uid, "tags", tagId);
}

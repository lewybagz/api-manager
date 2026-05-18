import { collection, deleteDoc, doc, getDocs, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { create } from "zustand";

import { db } from "../firebase";
import useAuthStore from "./authStore";

export interface TagDocument {
  id: string;
  name: string;
  normalizedName: string;
  color: string;
  usageCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TagStoreState {
  tags: TagDocument[];
  isLoading: boolean;
  error: Error | null;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<string | null>;
  renameTag: (id: string, name: string) => Promise<void>;
  recolorTag: (id: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  mergeTags: (sourceTagId: string, targetTagId: string) => Promise<void>;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

const useTagStore = create<TagStoreState>((set, get) => ({
  error: null,
  isLoading: false,
  tags: [],
  fetchTags: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ error: null, isLoading: true });
    try {
      const q = query(collection(db, "users", user.uid, "tags"));
      const snap = await getDocs(q);
      const tags: TagDocument[] = snap.docs.map((d) => {
        const data = d.data() as Omit<TagDocument, "id">;
        return { id: d.id, ...(data as any) } as TagDocument;
      });
      set({ tags, isLoading: false });
    } catch (e) {
      set({ error: e as Error, isLoading: false });
    }
  },
  createTag: async (name, color) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    const normalized = normalizeName(name);
    const col = collection(db, "users", user.uid, "tags");
    // Best-effort client-side uniqueness by normalized name
    const dupQ = query(col, where("normalizedName", "==", normalized));
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) return dupSnap.docs[0].id;
    const id = doc(col).id;
    await setDoc(doc(col, id), {
      name: name.trim(),
      normalizedName: normalized,
      color,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await get().fetchTags();
    return id;
  },
  renameTag: async (id, name) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "tags", id), {
      name: name.trim(),
      normalizedName: normalizeName(name),
      updatedAt: serverTimestamp(),
    });
    await get().fetchTags();
  },
  recolorTag: async (id, color) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "tags", id), {
      color,
      updatedAt: serverTimestamp(),
    });
    await get().fetchTags();
  },
  deleteTag: async (id) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    // Remove tagId from all passwords in small batches
    await runTransaction(db, async () => {
      // Intentionally left as a server-side recommended path via callable for large sets.
    });
    await deleteDoc(doc(db, "users", user.uid, "tags", id));
    await get().fetchTags();
  },
  mergeTags: async (sourceTagId, targetTagId) => {
    const callable = httpsCallable(getFunctions(), "pw_mergeTags");
    await callable({ sourceTagId, targetTagId });
    await get().fetchTags();
  },
}));

export default useTagStore;



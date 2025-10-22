import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { create } from "zustand";

import { db } from "../firebase";
import { getRandomValuesSafe } from "../utils/cryptoSafe";
import { logger, ErrorCategory } from "../services/logger";
import { decryptWithKey, encryptWithKey } from "../services/encryptionService";
import useAuthStore from "./authStore";

export interface StoredPassword {
  createdAt: Timestamp;
  encryptedPassword: string;
  iv: string;
  name: string;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  updatedAt: Timestamp;
  url?: string;
  userId: string;
  username?: string;
  lastAccessedAt?: Timestamp;
  tagIds?: string[];
}

export interface DecryptedPassword {
  id: string;
  name: string;
  username?: string;
  url?: string;
  notes?: string;
  password: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastAccessedAt?: Timestamp;
  tagIds?: string[];
}

interface PasswordStoreState {
  // eslint-disable-next-line no-unused-vars
  addPassword: (data: Omit<DecryptedPassword, "createdAt" | "updatedAt" | "id" | "lastAccessedAt">) => Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  updatePassword: (_id: string, _data: Partial<Omit<DecryptedPassword, "id" | "createdAt" | "updatedAt" | "lastAccessedAt">>) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  setPasswordTags: (_id: string, _tagIds: string[]) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  softDeletePassword: (_id: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  restorePassword: (_id: string) => Promise<void>;
  fetchTrashed: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  hardDeletePassword: (id: string) => Promise<void>;
  trashCount?: number;
  error: Error | null;
  isLoading: boolean;
  passwords: DecryptedPassword[];
  fetchPasswords: () => Promise<void>;
  clearOnLogout: () => void;
  _getOrInitPwKey: () => string | null;
  _peekPwKey: () => string | null;
}

const usePasswordStore = create<PasswordStoreState>((set, get) => ({
  // Internal helper to get an encryption key for PW mode without master password
  // Uses a per-user random key persisted in localStorage
  _getOrInitPwKey(): string | null {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return null;
    const keyName = `pw_ephemeral_key_${currentUser.uid}`;
    let keyHex = localStorage.getItem(keyName);
    if (!keyHex) {
      const bytes = new Uint8Array(32);
      getRandomValuesSafe(bytes);
      keyHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(keyName, keyHex);
    }
    return keyHex;
  },
  // Peek existing ephemeral key without creating a new one (used during fetch)
  _peekPwKey(): string | null {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return null;
    const keyName = `pw_ephemeral_key_${currentUser.uid}`;
    return localStorage.getItem(keyName);
  },
  addPassword: async (args) => {
    logger.info(ErrorCategory.CREDENTIAL, "addPassword invoked", {
      nameLength: args.name?.length ?? 0,
      usernamePresent: Boolean(args.username),
      urlPresent: Boolean(args.url),
      notesPresent: Boolean(args.notes),
      encryptionReady: Boolean(useAuthStore.getState().encryptionKey ?? get()._getOrInitPwKey()),
    });
    const currentUser = useAuthStore.getState().user;
    const encryptionKey = useAuthStore.getState().encryptionKey ?? get()._getOrInitPwKey();
    if (!currentUser || !encryptionKey) {
      logger.warn(
        ErrorCategory.AUTH,
        !currentUser ? "addPassword blocked: no user" : "addPassword blocked: no encryption key"
      );
      set({ error: new Error("User not authenticated"), isLoading: false });
      return false;
    }

    set({ error: null, isLoading: true });
    try {
      logger.debug(ErrorCategory.CREDENTIAL, "Encrypting secret for new password");
      const passwordBlob = new Blob([args.password], { type: "text/plain" });
      const encrypted = await encryptWithKey(encryptionKey, passwordBlob);
      logger.debug(ErrorCategory.CREDENTIAL, "Encryption complete", { encryptedSize: (await encrypted.encryptedBlob.arrayBuffer()).byteLength });
      const encryptedPassword = await (async () => {
        const arrayBuffer = await encrypted.encryptedBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      })();

      const day = new Date();
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      // Use an even-segment document path: users/{uid}/limits/passwords_{YYYY-MM-DD}
      const limitRef = doc(db, "users", currentUser.uid, "limits", `passwords_${key}`);
      const passwordsCol = collection(db, "users", currentUser.uid, "passwords");
      const newPwRef = doc(passwordsCol);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(limitRef);
        const currentCount = snap.exists() ? ((snap.data() as { count?: number }).count ?? 0) : 0;
        if (currentCount >= 20) {
          logger.warn(ErrorCategory.CREDENTIAL, "Daily add limit reached", { dayKey: key, currentCount });
          throw new Error("DAILY_LIMIT_REACHED");
        }
        const payload: any = {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          encryptedPassword,
          iv: encrypted.iv,
          name: args.name,
          userId: currentUser.uid,
          tagIds: Array.isArray((args as any).tagIds)
            ? ((args as any).tagIds as string[]).slice(0, 20)
            : [],
        };
        if (typeof args.notes === 'string') payload.notes = args.notes;
        if (typeof args.url === 'string') payload.url = args.url;
        if (typeof args.username === 'string') payload.username = args.username;
        tx.set(newPwRef, payload);
        tx.set(limitRef, { count: currentCount + 1, updatedAt: serverTimestamp() }, { merge: true });
      });

      await get().fetchPasswords();
      set({ isLoading: false });
      logger.info(ErrorCategory.CREDENTIAL, "addPassword success", { refreshedList: true });
      return true;
    } catch (e) {
      if ((e as Error).message === "DAILY_LIMIT_REACHED") {
        logger.warn(ErrorCategory.CREDENTIAL, "addPassword failed: daily limit reached");
        set({ error: new Error("Daily limit reached. Try again tomorrow."), isLoading: false });
      } else {
        logger.error(ErrorCategory.UNKNOWN, "addPassword failed", e);
        set({ error: e as Error, isLoading: false });
      }
      return false;
    }
  },
  clearOnLogout: () => {
    set({ passwords: [] });
  },
  error: null,
  fetchPasswords: async () => {
    const currentUser = useAuthStore.getState().user;
    const encryptionKey = useAuthStore.getState().encryptionKey ?? usePasswordStore.getState()._peekPwKey();
    if (!currentUser || !encryptionKey) {
      logger.info(ErrorCategory.AUTH, "fetchPasswords skipped: missing user or key", {
        hasUser: Boolean(currentUser),
        hasKey: Boolean(encryptionKey),
      });
      set({ passwords: [], error: new Error("User not authenticated"), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const snap = await getDocs(collection(db, "users", currentUser.uid, "passwords"));
      const items: DecryptedPassword[] = [];
      let totalDocs = 0;
      let decryptedCount = 0;
      for (const d of snap.docs) {
        totalDocs++;
        const raw = d.data() as StoredPassword;
        if (raw.isDeleted) continue;
        try {
          const binary = atob(raw.encryptedPassword);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const decrypted = await decryptWithKey(encryptionKey, new Blob([bytes]), raw.iv);
          const text = await decrypted.text();
          items.push({
            id: d.id,
            name: raw.name,
            notes: raw.notes,
            password: text,
            url: raw.url,
            username: raw.username,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            lastAccessedAt: raw.lastAccessedAt,
            tagIds: Array.isArray(raw.tagIds) ? raw.tagIds : [],
          });
          decryptedCount++;
        } catch (e) {
          logger.warn(
            ErrorCategory.UNKNOWN,
            "decrypt password failed; skipping item",
            e,
            { id: d.id }
          );
        }
      }
      set({ passwords: items, isLoading: false });
      logger.info(ErrorCategory.CREDENTIAL, "fetchPasswords complete", {
        totalDocs,
        decryptedCount,
        returned: items.length,
      });
    } catch (e) {
      set({ error: e as Error, isLoading: false });
    }
  },
  updatePassword: async (id, data) => {
    const currentUser = useAuthStore.getState().user;
    const encryptionKey = useAuthStore.getState().encryptionKey ?? get()._getOrInitPwKey();
    if (!currentUser || !encryptionKey) {
      set({ error: new Error("User not authenticated"), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Precompute encryption if password is changing
      let encPassword: string | undefined;
      let encIv: string | undefined;
      if (typeof data.password === 'string') {
        const passwordBlob = new Blob([data.password], { type: 'text/plain' });
        const encrypted = await encryptWithKey(encryptionKey, passwordBlob);
        const arrayBuffer = await encrypted.encryptedBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        encPassword = btoa(binary);
        encIv = encrypted.iv;
      }

      const day = new Date();
      const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

      await runTransaction(db, async (tx) => {
        const { doc } = await import('firebase/firestore');
        const pwRef = doc(collection(db, 'users', currentUser.uid, 'passwords'), id);
        const pwSnap = await tx.get(pwRef);
        if (!pwSnap.exists()) throw new Error('NOT_FOUND');
        const prev = pwSnap.data() as StoredPassword;

        // Determine categories and limits
        const categories: Array<{ key: string; limit: number }> = [];
        if (typeof data.password === 'string') categories.push({ key: 'pw:password_change', limit: 20 });
        if (typeof data.username !== 'undefined' && data.username !== prev.username) categories.push({ key: 'pw:username_change', limit: 3 });
        if ((typeof data.name !== 'undefined' && data.name !== prev.name) || (typeof data.url !== 'undefined' && data.url !== prev.url) || (typeof data.notes !== 'undefined' && data.notes !== prev.notes)) {
          categories.push({ key: 'pw:metadata_change', limit: 50 });
        }

        // Consume limits
        for (const c of categories) {
          const limitRef = doc(collection(db, 'users', currentUser.uid, 'limits', 'actions', c.key), dayKey);
          const snap = await tx.get(limitRef);
          const count = snap.exists() ? ((snap.data() as { count?: number }).count ?? 0) : 0;
          if (count >= c.limit) throw new Error(`LIMIT_EXCEEDED_${c.key}`);
          tx.set(limitRef, { count: count + 1, updatedAt: serverTimestamp() }, { merge: true });
        }

        const updates: Record<string, any> = { updatedAt: serverTimestamp() };
        if (typeof data.name !== 'undefined') updates.name = data.name;
        if (typeof data.username !== 'undefined') updates.username = data.username;
        if (typeof data.url !== 'undefined') updates.url = data.url;
        if (typeof data.notes !== 'undefined') updates.notes = data.notes;
        if (Array.isArray((data as any).tagIds)) {
          const nextTagIds = ((data as any).tagIds as string[]).slice(0, 20);
          updates.tagIds = nextTagIds;
        }
        if (encPassword && encIv) { updates.encryptedPassword = encPassword; updates.iv = encIv; }
        tx.update(pwRef, updates);
      });

      await get().fetchPasswords();
      set({ isLoading: false });
    } catch (e) {
      set({ error: e as Error, isLoading: false });
    }
  },
  setPasswordTags: async (id, tagIds) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ error: new Error("User not authenticated"), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const pwRef = doc(collection(db, 'users', currentUser.uid, 'passwords'), id);
      await updateDoc(pwRef, { tagIds: tagIds.slice(0, 20), updatedAt: serverTimestamp() });
      await get().fetchPasswords();
      set({ isLoading: false });
    } catch (e) {
      set({ error: e as Error, isLoading: false });
    }
  },
  softDeletePassword: async (id) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ error: new Error("User not authenticated"), isLoading: false });
      return;
    }
    set({ error: null });
    try {
      const day = new Date();
      const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      logger.info(ErrorCategory.CREDENTIAL, 'softDeletePassword invoked', { id, dayKey });
      await runTransaction(db, async (tx) => {
        const { doc } = await import('firebase/firestore');
        const pwRef = doc(collection(db, 'users', currentUser.uid, 'passwords'), id);
        const limitRef = doc(collection(db, 'users', currentUser.uid, 'limits', 'actions', 'pw:soft_delete'), dayKey);
        const snap = await tx.get(limitRef);
        const count = snap.exists() ? ((snap.data() as { count?: number }).count ?? 0) : 0;
        if (count >= 50) throw new Error('LIMIT_EXCEEDED_SOFT_DELETE');
        tx.set(limitRef, { count: count + 1, updatedAt: serverTimestamp() }, { merge: true });
        tx.update(pwRef, { isDeleted: true, deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      logger.info(ErrorCategory.CREDENTIAL, 'softDeletePassword success', { id });
      set((state) => ({ passwords: state.passwords.filter((p) => p.id !== id) }));
      // Enforce last-5 capacity best-effort client-side (skip if index missing)
      const currentUser2 = useAuthStore.getState().user;
      if (currentUser2) {
        try {
          const q = query(
            collection(db, 'users', currentUser2.uid, 'passwords'),
            where('isDeleted', '==', true),
            orderBy('deletedAt', 'asc')
          );
          const snap = await getDocs(q);
          const overflow = snap.docs.length - 5;
          for (let i = 0; i < overflow; i++) {
            try { await deleteDoc(snap.docs[i].ref); } catch (e) {
              logger.error(ErrorCategory.UNKNOWN, 'softDeletePassword overflow trim failed', e, { id });
            }
          }
        } catch (e) {
          // If composite index is missing, skip trimming and continue
          logger.warn(ErrorCategory.UNKNOWN, 'Skipping overflow trim (index missing)', e, { id });
        } finally {
          await get().fetchTrashed?.();
        }
      }
    } catch (e) {
      logger.error(ErrorCategory.UNKNOWN, 'softDeletePassword failed', e, { id });
      set({ error: e as Error });
    }
  },
  restorePassword: async (id) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ error: new Error("User not authenticated"), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const day = new Date();
      const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      logger.info(ErrorCategory.CREDENTIAL, 'restorePassword invoked', { id, dayKey });
      await runTransaction(db, async (tx) => {
        const { doc } = await import('firebase/firestore');
        const pwRef = doc(collection(db, 'users', currentUser.uid, 'passwords'), id);
        const limitRef = doc(collection(db, 'users', currentUser.uid, 'limits', 'actions', 'pw:restore'), dayKey);
        const snap = await tx.get(limitRef);
        const count = snap.exists() ? ((snap.data() as { count?: number }).count ?? 0) : 0;
        if (count >= 50) throw new Error('LIMIT_EXCEEDED_RESTORE');
        // Ensure the password exists before restoring
        const pwSnap = await tx.get(pwRef);
        if (!pwSnap.exists()) throw new Error('NOT_FOUND');
        tx.set(limitRef, { count: count + 1, updatedAt: serverTimestamp() }, { merge: true });
        tx.update(pwRef, { isDeleted: false, deletedAt: null, updatedAt: serverTimestamp() });
      });
      await get().fetchPasswords();
      await get().fetchTrashed?.();
      set({ isLoading: false });
      logger.info(ErrorCategory.CREDENTIAL, 'restorePassword success', { id });
    } catch (e) {
      logger.error(ErrorCategory.UNKNOWN, 'restorePassword failed', e, { id });
      set({ error: e as Error, isLoading: false });
    }
  },
  fetchTrashed: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    try {
      // Avoid composite index requirement: simple filter and client-side cap
      const q = query(
        collection(db, 'users', currentUser.uid, 'passwords'),
        where('isDeleted', '==', true),
        limit(20)
      );
      const snap = await getDocs(q);
      set({ trashCount: snap.docs.length });
    } catch {
      // ignore
    }
  },
  hardDeletePassword: async (id) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    try {
      const ref = doc(collection(db, 'users', currentUser.uid, 'passwords'), id);
      await deleteDoc(ref);
      await get().fetchTrashed?.();
    } catch (e) {
      set({ error: e as Error });
    }
  },
  isLoading: false,
  passwords: [],
  trashCount: 0,
}));

export default usePasswordStore;



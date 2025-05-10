import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import CryptoJS from 'crypto-js';
import useUserStore from './userStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  masterPasswordSet: boolean;
  encryptionKey: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  subscribeToAuthState: () => () => void;
  setMasterPassword: (password: string) => Promise<void>;
  clearEncryptionKey: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  masterPasswordSet: false,
  encryptionKey: null,
  setUser: (user) => {
    set({ user });
    if (user) {
      useUserStore.getState().fetchUserDoc(user.uid);
    } else {
      useUserStore.getState().clearUserDoc();
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  subscribeToAuthState: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        set({ user, isLoading: false, error: null });
        if (!user) {
          get().clearEncryptionKey();
        }
      },
      (error) => {
        set({ user: null, isLoading: false, error });
        get().clearEncryptionKey();
      }
    );
    return unsubscribe;
  },
  setMasterPassword: async (password: string) => {
    if (!get().user?.uid) {
      const err = new Error("User not authenticated. Cannot set master password.");
      set({ error: err, masterPasswordSet: false, encryptionKey: null });
      console.error(err);
      return;
    }
    const salt = get().user!.uid;
    const iterations = 100000;
    const keySize = 256 / 32;

    try {
      set({ isLoading: true });
      const derivedKey = CryptoJS.PBKDF2(password, salt, {
        keySize: keySize,
        iterations: iterations,
        hasher: CryptoJS.algo.SHA256,
      });
      
      const keyString = derivedKey.toString(CryptoJS.enc.Hex);

      set({
        encryptionKey: keyString,
        masterPasswordSet: true,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
      console.error("Error deriving encryption key:", e);
      set({
        error: new Error('Failed to derive encryption key.'),
        masterPasswordSet: false,
        encryptionKey: null,
        isLoading: false,
      });
    }
  },
  clearEncryptionKey: () => {
    set({
      encryptionKey: null,
      masterPasswordSet: false,
    });
  },
}));

onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setError(null);
});

export default useAuthStore; 
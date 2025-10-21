import type { User } from 'firebase/auth';

import CryptoJS from 'crypto-js';
import { onAuthStateChanged } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '../firebase';
import useUserStore from './userStore';

interface AuthState {
  checkPersistedEncryptionKey: () => void;
  clearEncryptionKey: () => void;
  closeMasterPasswordModal: () => void;
  encryptionKey: null | string;
  error: Error | null;
  isLoading: boolean;
  isMasterPasswordModalExplicitlyOpen: boolean;
  masterPasswordSet: boolean;
  lockNow: () => Promise<void>;
  openMasterPasswordModal: () => void;
  setError: (error: Error | null) => void;
  setLoading: (loading: boolean) => void;
  setMasterPassword: (password: string) => Promise<void>;
  setUser: (user: null | User) => void;
  subscribeToAuthState: () => () => void;
  user: null | User;
}

// Secure local storage helper functions
const secureLocalStorage = {
  // Retrieve a stored value
  getItem: (key: string): null | string => {
    try {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return null;
      return atob(storedValue); // base64 decoding
    } catch (e) {
      console.error('Failed to retrieve item from secure storage:', e);
      return null;
    }
  },
  
  // Remove a stored value
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove item from secure storage:', e);
    }
  },
  
  // Store a value with added security
  setItem: (key: string, value: string): void => {
    try {
      // Use a simple obfuscation (not true encryption) to avoid plaintext storage
      // This isn't perfect security but better than plain localStorage
      const obfuscated = btoa(value); // base64 encoding
      localStorage.setItem(key, obfuscated);
    } catch (e) {
      console.error('Failed to store item in secure storage:', e);
    }
  }
};

const useAuthStore = create<AuthState>((set, get) => ({
  checkPersistedEncryptionKey: () => {
    const userId = get().user?.uid;
    if (!userId) return;
    
    // Check if we have a stored master password hash for this user
    const storedPasswordHash = secureLocalStorage.getItem(`master_password_hash_${userId}`);
    const storedKeyHash = secureLocalStorage.getItem(`encryption_key_hash_${userId}`);
    
    if (storedPasswordHash && storedKeyHash) {
      // We don't want to auto-set the master password, but we can indicate that it was previously set
      // The user will need to enter it again, but we'll know it exists
      console.log("Found persisted master password information. User needs to re-enter password.");
      
      // Later we can add a feature to verify the entered password matches the stored hash
      // For now, just log it so we know it's working
    }
  },
  clearEncryptionKey: () => {
    const user = get().user;
    if (user?.uid) {
      secureLocalStorage.removeItem(`encryption_key_hash_${user.uid}`);
      secureLocalStorage.removeItem(`master_password_hash_${user.uid}`);
    }
    
    set({
      encryptionKey: null,
      masterPasswordSet: false,
    });
    
    // Clear any sensitive data from sessionStorage
    sessionStorage.removeItem('salt_random_component');
  },
  closeMasterPasswordModal: () => { set({ isMasterPasswordModalExplicitlyOpen: false }); },
  encryptionKey: null,
  error: null,
  isLoading: true,
  isMasterPasswordModalExplicitlyOpen: false,
  masterPasswordSet: false,
  lockNow: async () => {
    try {
      get().clearEncryptionKey();
      // Best-effort sign-out
      await auth.signOut();
    } catch {
      // ignore
    }
  },
  openMasterPasswordModal: () => { set({ isMasterPasswordModalExplicitlyOpen: true }); },
  setError: (error) => { set({ error }); },
  setLoading: (loading) => { set({ isLoading: loading }); },
  // This is a synchronous operation but we use async signature to indicate it could take time
  setMasterPassword: (password: string): Promise<void> => {
    const user = get().user;
    if (!user?.uid) {
      const err = new Error("User not authenticated. Cannot set master password.");
      set({ encryptionKey: null, error: err, masterPasswordSet: false });
      console.error(err);
      return Promise.resolve();
    }
    
    // Use a fixed salt based on the user ID for consistent key derivation
    // This ensures the same password always generates the same key
    const salt = user.uid;
    const iterations = 310000; // Increased from 100000 to meet current security standards
    const keySize = 256 / 32;

    try {
      set({ isLoading: true });
      // PBKDF2 is CPU-intensive but synchronous in CryptoJS
      const derivedKey = CryptoJS.PBKDF2(password, salt, {
        hasher: CryptoJS.algo.SHA256,
        iterations,
        keySize,
      });
      
      const keyString = derivedKey.toString(CryptoJS.enc.Hex);

      // Store the encryption key indicator in localStorage
      // We don't store the actual key, just a hash of it to verify later
      const keyHash = CryptoJS.SHA256(keyString).toString(CryptoJS.enc.Hex);
      secureLocalStorage.setItem(`encryption_key_hash_${user.uid}`, keyHash);
      
      // Store the master password hash in localStorage (not the password itself)
      const passwordHash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
      secureLocalStorage.setItem(`master_password_hash_${user.uid}`, passwordHash);

      set({
        encryptionKey: keyString,
        error: null,
        isLoading: false,
        isMasterPasswordModalExplicitlyOpen: false,
        masterPasswordSet: true,
      });
      
      return Promise.resolve();
    } catch (e) {
      console.error("Error deriving encryption key:", e);
      const error = e instanceof Error ? e : new Error('Failed to derive encryption key');
      set({
        encryptionKey: null,
        error: new Error('Failed to derive encryption key.'),
        isLoading: false,
        masterPasswordSet: false,
      });
      return Promise.reject(error);
    }
  },
  setUser: (user) => {
    set({ user });
    if (user) {
      // Mark promise as intentionally not awaited with void
      void useUserStore.getState().fetchUserDoc(user.uid);
      // Check if we have a persisted encryption key for this user
      get().checkPersistedEncryptionKey();
      
      // Activity-based idle timer (resets on user activity)
      const IDLE_MS = 30 * 60 * 1000; // 30 minutes
      let idleTimer = window.setTimeout(() => { void get().lockNow(); }, IDLE_MS);
      const resetIdle = () => {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => { void get().lockNow(); }, IDLE_MS);
      };
      const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"] as const;
      activityEvents.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));

      // Visibility lock: if hidden for more than 5 minutes, lock on show
      let hiddenAt: number | null = null;
      const onVis = () => {
        if (document.hidden) {
          hiddenAt = Date.now();
        } else if (hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) {
          hiddenAt = null;
          void get().lockNow();
        }
      };
      document.addEventListener("visibilitychange", onVis);
      
      // Persist listeners for cleanup
      sessionStorage.setItem('idleListeners', 'active');
      (window as any).__idle_cleanup__ = () => {
        window.clearTimeout(idleTimer);
        activityEvents.forEach((ev) => window.removeEventListener(ev, resetIdle));
        document.removeEventListener("visibilitychange", onVis);
      };
    } else {
      useUserStore.getState().clearUserDoc();
      // Cleanup idle/visibility listeners
      try { (window as any).__idle_cleanup__?.(); } catch {}
      sessionStorage.removeItem('idleListeners');
      // Also close the explicit modal on logout if it was open
      set({ isMasterPasswordModalExplicitlyOpen: false });
    }
  },
  subscribeToAuthState: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        set({ error: null, isLoading: false, user });
        if (!user) {
          get().clearEncryptionKey();
          // Clear any existing session data
          sessionStorage.clear();
        }
      },
      (error) => {
        set({ error, isLoading: false, user: null });
        get().clearEncryptionKey();
        // Clear any existing session data
        sessionStorage.clear();
      }
    );
    return unsubscribe;
  },
  user: null,
}));

onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setError(null);
});

export default useAuthStore; 
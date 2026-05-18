import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { create } from "zustand";

import type { UserDocument } from "../types/user";

import { auth, db } from "../firebase";

interface UserStore {
  clearUserDoc: () => void;
  error: Error | null;
  fetchUserDoc: (uid: string) => Promise<void>;
  isLoading: boolean;
  updateUserDoc: (uid: string, data: Partial<UserDocument>) => Promise<void>;
  userDoc: null | UserDocument;
}

const useUserStore = create<UserStore>((set) => ({
  clearUserDoc: () => {
    set({ error: null, userDoc: null });
  },
  error: null,
  fetchUserDoc: async (uid: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
      set({ error: new Error('User not authenticated or mismatched ID'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Updated path to use root-level user document
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        set({ userDoc: userSnap.data() as UserDocument });
      } else {
        // Create user document if it doesn't exist
        const newUserDoc: UserDocument = {
          appType: 'api',
          billing: { status: 'trialing' },
          createdAt: Timestamp.now(),
          displayName: currentUser.displayName,
          email: currentUser.email ?? "",
          roles: ["user"],
          // App-managed 7-day trial
          trialEndsAt: Timestamp.fromMillis(Timestamp.now().toMillis() + 7 * 24 * 60 * 60 * 1000),
          uid,
          updatedAt: Timestamp.now(),
        };
        await setDoc(userRef, newUserDoc);
        set({ userDoc: newUserDoc });
      }
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },
  isLoading: false,
  updateUserDoc: async (uid: string, data: Partial<UserDocument>) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
      set({ error: new Error('User not authenticated or mismatched ID'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Updated path to use root-level user document
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
      set((state) => ({
        userDoc: state.userDoc ? { ...state.userDoc, ...data } : null,
      }));
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },
  userDoc: null,
}));

// Subscribe to auth changes to clear user doc on logout
auth.onAuthStateChanged(user => {
  if (!user) {
    useUserStore.getState().clearUserDoc();
  }
});

export default useUserStore; 
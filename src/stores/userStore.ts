import { create } from "zustand";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { UserDocument } from "../types/user";

interface UserStore {
  userDoc: UserDocument | null;
  isLoading: boolean;
  error: Error | null;
  fetchUserDoc: (uid: string) => Promise<void>;
  updateUserDoc: (uid: string, data: Partial<UserDocument>) => Promise<void>;
  clearUserDoc: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  userDoc: null,
  isLoading: false,
  error: null,

  fetchUserDoc: async (uid: string) => {
    set({ isLoading: true, error: null });
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        set({ userDoc: userSnap.data() as UserDocument });
      } else {
        // Create user document if it doesn't exist
        const newUserDoc: UserDocument = {
          uid,
          email: "", // Will be updated from auth
          displayName: null,
          roles: ["user"],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await setDoc(userRef, newUserDoc);
        set({ userDoc: newUserDoc });
      }
    } catch (error) {
      set({ error: error as Error });
      console.error("Error fetching user document:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserDoc: async (uid: string, data: Partial<UserDocument>) => {
    set({ isLoading: true, error: null });
    try {
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
      console.error("Error updating user document:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearUserDoc: () => set({ userDoc: null, error: null }),
}));

export default useUserStore; 
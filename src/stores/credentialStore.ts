import { create } from 'zustand';
import CryptoJS from 'crypto-js';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch // For deleting all credentials of a project
} from 'firebase/firestore';
import useAuthStore from './authStore'; // To get encryptionKey
import useProjectStore from './projectStore';

// Interface for the raw (decrypted) credential data
export interface DecryptedCredential {
  id: string; // Firestore document ID
  userId: string;
  projectId: string;
  serviceName: string;
  apiKey: string;
  apiSecret?: string; 
  notes?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// Interface for the data stored in Firestore (encrypted parts)
interface StoredCredentialData {
  userId: string;
  projectId: string;
  serviceName: string;
  encryptedApiKey: string;
  encryptedApiSecret?: string;
  encryptedNotes?: string;
  iv: string; // Initialization Vector used for encryption
  createdAt: Timestamp | any; // Allow any for serverTimestamp on create
  updatedAt: Timestamp | any; // Allow any for serverTimestamp on create/update
}

interface CredentialState {
  credentials: DecryptedCredential[];
  isLoading: boolean;
  error: Error | null;
  fetchCredentials: (projectId: string) => Promise<void>;
  fetchAllCredentials: () => Promise<void>;
  addCredential: (projectId: string, data: Omit<DecryptedCredential, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateCredential: (credentialId: string, currentProjectId: string, data: Partial<Omit<DecryptedCredential, 'id' | 'userId' | 'projectId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteCredential: (credentialId: string, currentProjectId: string) => Promise<void>;
  deleteCredentialsByProject: (projectId: string) => Promise<void>; // For when a project is deleted
  clearCredentials: () => void;
}

// Updated Helper function for encryption
const encryptData = (text: string, key: string, ivString?: string): { encryptedText: string; iv: string } | null => {
  if (!text || !key) return null;
  try {
    const iv = ivString ? CryptoJS.enc.Hex.parse(ivString) : CryptoJS.lib.WordArray.random(128 / 8);
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return {
      encryptedText: encrypted.toString(),
      iv: CryptoJS.enc.Hex.stringify(iv) // Return the IV used (either provided or generated)
    };
  } catch (e) {
    console.error("Encryption error:", e);
    return null;
  }
};

// Helper function for decryption
const decryptData = (encryptedText: string, key: string, ivString: string): string | null => {
  if (!encryptedText || !key || !ivString) return null;
  try {
    const iv = CryptoJS.enc.Hex.parse(ivString);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Hex.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText && encryptedText) { // Check if decryption resulted in an empty string but had input
        console.warn("Decryption resulted in empty string. Key or IV might be incorrect or data corrupted.");
    }
    return decryptedText;
  } catch (e) {
    console.error("Decryption error:", e);
    // It's common for decryption to fail if the key is wrong or data is corrupt
    // Return null or throw error based on how you want to handle this in UI
    return null; 
  }
};

const useCredentialStore = create<CredentialState>((set, get) => ({
  credentials: [],
  isLoading: false,
  error: null,

  fetchCredentials: async (projectId: string) => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!currentUser || !encryptionKey) {
      set({ credentials: [], error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'credentials'), where('projectId', '==', projectId), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedCredentials: DecryptedCredential[] = [];
      querySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as StoredCredentialData;
        const apiKey = decryptData(data.encryptedApiKey, encryptionKey, data.iv);
        // apiSecret and notes are optional
        const apiSecret = data.encryptedApiSecret ? decryptData(data.encryptedApiSecret, encryptionKey, data.iv) : undefined;
        const notes = data.encryptedNotes ? decryptData(data.encryptedNotes, encryptionKey, data.iv) : undefined;

        if (apiKey === null) { // If critical data like apiKey fails to decrypt, skip or handle error
            console.error(`Failed to decrypt API key for credential ID: ${docSnap.id}. Skipping.`);
            // Optionally set a specific error or add to a list of failed decryptions
            // For now, we just log and skip.
            return; 
        }

        fetchedCredentials.push({
          id: docSnap.id,
          userId: data.userId,
          projectId: data.projectId,
          serviceName: data.serviceName,
          apiKey: apiKey, // Successfully decrypted
          apiSecret: apiSecret !== null ? apiSecret : undefined, // Handle null from decryption as undefined
          notes: notes !== null ? notes : undefined, // Handle null from decryption as undefined
          createdAt: data.createdAt as Timestamp,
          updatedAt: data.updatedAt as Timestamp,
        });
      });
      set({ credentials: fetchedCredentials, isLoading: false });
    } catch (e: any) {
      console.error("Error fetching credentials:", e);
      set({ error: e, isLoading: false });
    }
  },

  fetchAllCredentials: async () => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!currentUser || !encryptionKey) {
      set({ credentials: [], error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'credentials'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedCredentials: DecryptedCredential[] = [];
      querySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as StoredCredentialData;
        const apiKey = decryptData(data.encryptedApiKey, encryptionKey, data.iv);
        const apiSecret = data.encryptedApiSecret ? decryptData(data.encryptedApiSecret, encryptionKey, data.iv) : undefined;
        const notes = data.encryptedNotes ? decryptData(data.encryptedNotes, encryptionKey, data.iv) : undefined;
        if (apiKey === null) {
          console.error(`Failed to decrypt API key for credential ID: ${docSnap.id}. Skipping.`);
          return;
        }
        fetchedCredentials.push({
          id: docSnap.id,
          userId: data.userId,
          projectId: data.projectId,
          serviceName: data.serviceName,
          apiKey: apiKey,
          apiSecret: apiSecret !== null ? apiSecret : undefined,
          notes: notes !== null ? notes : undefined,
          createdAt: data.createdAt as Timestamp,
          updatedAt: data.updatedAt as Timestamp,
        });
      });
      set({ credentials: fetchedCredentials, isLoading: false });
    } catch (e: any) {
      console.error("Error fetching all credentials:", e);
      set({ error: e, isLoading: false });
    }
  },

  addCredential: async (projectId: string, data: Omit<DecryptedCredential, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!currentUser || !encryptionKey) {
      set({ error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return null;
    }
    set({ isLoading: true, error: null });
    try {
      const singleIV = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
      
      const encryptedApiKeyResult = encryptData(data.apiKey, encryptionKey, singleIV);
      if (!encryptedApiKeyResult?.encryptedText) throw new Error('Failed to encrypt API key.');

      const finalStoredData: StoredCredentialData = {
        userId: currentUser.uid,
        projectId: projectId,
        serviceName: data.serviceName,
        encryptedApiKey: encryptedApiKeyResult.encryptedText,
        iv: singleIV, // IV from the first successful encryption or the generated one
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (data.apiSecret) {
        const encryptedSecretResult = encryptData(data.apiSecret, encryptionKey, singleIV);
        if (!encryptedSecretResult) throw new Error('Failed to encrypt API secret.');
        finalStoredData.encryptedApiSecret = encryptedSecretResult.encryptedText;
      }
      if (data.notes) {
        const encryptedNotesResult = encryptData(data.notes, encryptionKey, singleIV);
        if (!encryptedNotesResult) throw new Error('Failed to encrypt notes.');
        finalStoredData.encryptedNotes = encryptedNotesResult.encryptedText;
      }

      console.log("Attempting to add credential with data:", finalStoredData);
      const docRef = await addDoc(collection(db, 'credentials'), finalStoredData);
      // Update the parent project with lastCredentialSummary and lastUpdated
      await useProjectStore.getState().updateProject(projectId, {
        lastCredentialSummary: {
          serviceName: data.serviceName,
          addedAt: serverTimestamp(),
        },
      });
      await get().fetchCredentials(projectId);
      return docRef.id;
    } catch (e: any) {
      console.error("Error adding credential:", e);
      set({ error: e, isLoading: false });
      return null;
    }
  },

  updateCredential: async (credentialId: string, currentProjectId: string, data: Partial<Omit<DecryptedCredential, 'id' | 'userId' | 'projectId' | 'createdAt' | 'updatedAt'>>) => {
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!encryptionKey) {
      set({ error: new Error('Master password not set.'), isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const dataToUpdateFirestore: Partial<StoredCredentialData> = { updatedAt: serverTimestamp() };

      const requiresReEncryption = 'apiKey' in data || 'apiSecret' in data || 'notes' in data;

      if (requiresReEncryption) {
        // Fetch the current full credential to get all existing values for re-encryption
        const currentCredentials = get().credentials;
        const currentDecryptedCredential = currentCredentials.find(c => c.id === credentialId);
        
        if (!currentDecryptedCredential) {
          throw new Error("Original credential not found for update, cannot re-encrypt.");
        }

        // Apply changes to a temporary decrypted object
        const tempDecryptedData = { ...currentDecryptedCredential, ...data };
        
        const newIV = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
        dataToUpdateFirestore.iv = newIV;

        // Re-encrypt all potentially sensitive fields with the new IV
        const encryptedApiKey = encryptData(tempDecryptedData.apiKey, encryptionKey, newIV);
        if (!encryptedApiKey) throw new Error('Failed to encrypt API key for update.');
        dataToUpdateFirestore.encryptedApiKey = encryptedApiKey.encryptedText;

        if (tempDecryptedData.apiSecret) {
          const encryptedApiSecret = encryptData(tempDecryptedData.apiSecret, encryptionKey, newIV);
          if (!encryptedApiSecret) throw new Error('Failed to encrypt API secret for update.');
          dataToUpdateFirestore.encryptedApiSecret = encryptedApiSecret.encryptedText;
        } else {
          // If apiSecret was explicitly set to undefined or empty in `data` and now `tempDecryptedData.apiSecret` is falsy
          dataToUpdateFirestore.encryptedApiSecret = ''; // Or FieldValue.delete()
        }

        if (tempDecryptedData.notes) {
          const encryptedNotes = encryptData(tempDecryptedData.notes, encryptionKey, newIV);
          if (!encryptedNotes) throw new Error('Failed to encrypt notes for update.');
          dataToUpdateFirestore.encryptedNotes = encryptedNotes.encryptedText;
        } else {
          // If notes was explicitly set to undefined or empty in `data`
          dataToUpdateFirestore.encryptedNotes = ''; // Or FieldValue.delete()
        }
      }

      // Handle serviceName separately as it's not encrypted
      if (data.serviceName) {
        dataToUpdateFirestore.serviceName = data.serviceName;
      }
      
      // Ensure there's something to update beyond just the timestamp
      const fieldCountToUpdate = Object.keys(dataToUpdateFirestore).length;
      if (fieldCountToUpdate <= 1 && !dataToUpdateFirestore.updatedAt) { // only timestamp
         console.warn("Update called without changes to actual data fields.");
         set({ isLoading: false });
         // Optionally still update timestamp if that's desired behavior for "touching" a record
         // await updateDoc(doc(db, 'credentials', credentialId), { updatedAt: serverTimestamp() });
         // await get().fetchCredentials(currentProjectId);
         return;
      }
      if (fieldCountToUpdate === 1 && dataToUpdateFirestore.updatedAt && !requiresReEncryption && !data.serviceName) {
        // This means only timestamp is being updated, and no encrypted fields or serviceName changed.
        // This scenario might happen if an update was called with an empty data object.
        // We can choose to proceed to update the timestamp or return.
        // For now, let's proceed to update the timestamp.
      }


      const credRef = doc(db, 'credentials', credentialId);
      await updateDoc(credRef, dataToUpdateFirestore);
      await get().fetchCredentials(currentProjectId); // Refetch for the relevant project
      set({ isLoading: false });
    } catch (e: any) {
      console.error("Error updating credential:", e);
      set({ error: e, isLoading: false });
    }
  },

  deleteCredential: async (credentialId: string, currentProjectId: string) => {
    set({ isLoading: true, error: null });
    // We need projectId to refetch, this should be passed or fetched before deleting
    // For now, UI will handle refetching or we clear all.
    try {
      await deleteDoc(doc(db, 'credentials', credentialId));
      // Optimistic update or refetch. Fetching for consistency:
      await get().fetchCredentials(currentProjectId);
      set({ isLoading: false }); 
    } catch (e: any) {
      console.error("Error deleting credential:", e);
      set({ error: e, isLoading: false });
    }
  },
  
  deleteCredentialsByProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
        const q = query(collection(db, 'credentials'), where('projectId', '==', projectId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref)); // Corrected: docSnap to doc
        await batch.commit();
        // Remove from local state as well
        set(state => ({
            credentials: state.credentials.filter(c => c.projectId !== projectId),
            isLoading: false
        }));
    } catch (e: any) {
        console.error(`Error deleting credentials for project ${projectId}:`, e);
        set({ error: e, isLoading: false });
    }
  },

  clearCredentials: () => {
    set({ credentials: [], isLoading: false, error: null });
  }
}));

// Ensure credentials are cleared if user logs out, similar to projectStore
auth.onAuthStateChanged(user => {
  if (!user) {
    useCredentialStore.getState().clearCredentials();
  }
});

// Also, when a project is deleted, its credentials should be deleted.
// This can be orchestrated by calling deleteCredentialsByProject from projectStore's deleteProject,
// or by listening to project deletions if we had a pub/sub system.
// For now, the UI/DashboardPage can call deleteCredentialsByProject after a project is deleted.

export default useCredentialStore; 
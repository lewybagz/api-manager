import CryptoJS from 'crypto-js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch // For deleting all credentials of a project
} from 'firebase/firestore';
import { create } from 'zustand';

import { auth, db } from '../firebase';
import useAuthStore from './authStore'; // To get encryptionKey
import useProjectStore from './projectStore';

// Interface for the raw (decrypted) credential data
export interface DecryptedCredential {
  apiKey: string;
  apiSecret?: string;
  createdAt: null | Timestamp;
  id: string; // Firestore document ID
  notes?: string;
  projectId: string; 
  serviceName: string;
  updatedAt: null | Timestamp;
  userId: string;
}

interface CredentialState {
  addCredential: (projectId: string, data: Omit<DecryptedCredential, 'createdAt' | 'id' | 'updatedAt' | 'userId'>) => Promise<null | string>;
  clearCredentials: () => void;
  credentials: DecryptedCredential[];
  deleteCredential: (credentialId: string, currentProjectId: string) => Promise<void>;
  deleteCredentialsByProject: (projectId: string) => Promise<void>; // For when a project is deleted
  error: Error | null;
  fetchAllCredentials: () => Promise<void>;
  fetchCredentials: (projectId: string) => Promise<void>;
  isLoading: boolean;
  resetCorruptedCredential: (credentialId: string, projectId: string) => Promise<void>;
  updateCredential: (credentialId: string, currentProjectId: string, data: Partial<Omit<DecryptedCredential, 'createdAt' | 'id' | 'projectId' | 'updatedAt' | 'userId'>>) => Promise<void>;
}

// Interface for the data stored in Firestore (encrypted parts)
interface StoredCredentialData {
  createdAt: ReturnType<typeof serverTimestamp> | Timestamp; // Allow serverTimestamp on create
  encryptedApiKey: string;
  encryptedApiSecret?: string;
  encryptedNotes?: string;
  iv: string; // Initialization Vector used for encryption
  projectId: string;
  serviceName: string;
  updatedAt: ReturnType<typeof serverTimestamp> | Timestamp; // Allow serverTimestamp on create/update
  userId: string;
}

// Updated Helper function for encryption
const encryptData = (text: string, key: string, ivString?: string): null | { encryptedText: string; iv: string } => {
  if (!text || !key) {
    console.error("Encryption error: Missing text or key");
    return null;
  }
  try {
    const iv = ivString ? CryptoJS.enc.Hex.parse(ivString) : CryptoJS.lib.WordArray.random(128 / 8);
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const ivHex = CryptoJS.enc.Hex.stringify(iv);
    return {
      encryptedText: encrypted.toString(),
      iv: ivHex // Return the IV used (either provided or generated)
    };
  } catch (e) {
    console.error("Encryption error:", e);
    return null;
  }
};

// Helper function for decryption
const decryptData = (encryptedText: string, key: string, ivString: string): null | string => {
  if (!encryptedText || !key || !ivString) {
    console.error("Decryption error: Missing encrypted text, key, or IV");
    return null;
  }
  
  try {
    // First validate that we have proper hex-encoded IV
    if (!/^[0-9a-fA-F]+$/.test(ivString)) {
      console.warn("Invalid IV format, not a valid hex string");
      return null;
    }
    
    const iv = CryptoJS.enc.Hex.parse(ivString);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Hex.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Check if the result is not empty before trying to convert to string
    if (decrypted.sigBytes <= 0) {
      console.warn("Decryption resulted in empty data");
      return null;
    }
    
    // Safely try to convert to UTF-8 string
    try {
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      // If we got an empty string but had input data, something went wrong
      if (!decryptedText && encryptedText) {
        console.warn("Decryption resulted in empty string. Key or IV might be incorrect or data corrupted.");
        return null;
      }
    
      return decryptedText;
    } catch (utf8Error) {
      console.error("Failed to decode decrypted data as UTF-8:", utf8Error);
      return null;
    }
  } catch (e) {
    console.error("Decryption error:", e);
    return null; 
  }
};

const useCredentialStore = create<CredentialState>((set, get) => ({
  addCredential: async (projectId: string, data: Omit<DecryptedCredential, 'createdAt' | 'id' | 'updatedAt' | 'userId'>) => {
    
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    
    if (!currentUser || !encryptionKey) {
      const errorMsg = !currentUser 
        ? 'User not authenticated' 
        : 'Master password not set';
      console.error(`Authentication error: ${errorMsg}`);
      set({ error: new Error(`User not authenticated or master password not set. (${errorMsg})`), isLoading: false });
      return null;
    }
    
    set({ error: null, isLoading: true });
    
    try {
      const singleIV = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
      
      const encryptedApiKeyResult = encryptData(data.apiKey, encryptionKey, singleIV);
      if (!encryptedApiKeyResult?.encryptedText) {
        console.error("Failed to encrypt API key");
        throw new Error('Failed to encrypt API key.');
      }

      const finalStoredData: StoredCredentialData = {
        createdAt: serverTimestamp(),
        encryptedApiKey: encryptedApiKeyResult.encryptedText,
        iv: singleIV,
        projectId: projectId,
        serviceName: data.serviceName,
        updatedAt: serverTimestamp(),
        userId: currentUser.uid,
      };

      if (data.apiSecret) {
        const encryptedSecretResult = encryptData(data.apiSecret, encryptionKey, singleIV);
        if (!encryptedSecretResult) {
          console.error("Failed to encrypt API secret");
          throw new Error('Failed to encrypt API secret.');
        }
        finalStoredData.encryptedApiSecret = encryptedSecretResult.encryptedText;
      }
      
      if (data.notes) {
        const encryptedNotesResult = encryptData(data.notes, encryptionKey, singleIV);
        if (!encryptedNotesResult) {
          console.error("Failed to encrypt notes");
          throw new Error('Failed to encrypt notes.');
        }
        finalStoredData.encryptedNotes = encryptedNotesResult.encryptedText;
      }

      // Updated path to use nested collections
      const credentialsRef = collection(db, 'users', currentUser.uid, 'projects', projectId, 'credentials');
      const docRef = await addDoc(credentialsRef, finalStoredData);
      
      await useProjectStore.getState().updateProject(projectId, {
        lastCredentialSummary: {
          addedAt: serverTimestamp(),
          serviceName: data.serviceName,
        },
      });
      
      await get().fetchCredentials(projectId);
      return docRef.id;
    } catch (e: unknown) {
      console.error("Error adding credential:", e);
      if (e instanceof Error) {
        console.error(`Error details: ${e.message}`);
        console.error(`Error stack: ${e.stack ?? 'No stack trace'}`);
      }
      set({ error: e instanceof Error ? e : new Error(String(e)), isLoading: false });
      return null;
    }
  },
  clearCredentials: () => {
    set({ credentials: [], error: null, isLoading: false });
  },
  credentials: [],

  deleteCredential: async (credentialId: string, currentProjectId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ error: new Error('User not authenticated'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Updated path to use nested collections
      const credRef = doc(db, 'users', currentUser.uid, 'projects', currentProjectId, 'credentials', credentialId);
      await deleteDoc(credRef);
      await get().fetchCredentials(currentProjectId);
      set({ isLoading: false });
    } catch (e: unknown) {
      console.error("Error deleting credential:", e);
      set({ error: e instanceof Error ? e : new Error(String(e)), isLoading: false });
    }
  },

  deleteCredentialsByProject: async (projectId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ error: new Error('User not authenticated'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Updated path to use nested collections
      const credentialsRef = collection(db, 'users', currentUser.uid, 'projects', projectId, 'credentials');
      const snapshot = await getDocs(credentialsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
      await batch.commit();
      set(state => ({
        credentials: state.credentials.filter(c => c.projectId !== projectId),
        isLoading: false
      }));
    } catch (e: unknown) {
      console.error(`Error deleting credentials for project ${projectId}:`, e);
      set({ error: e instanceof Error ? e : new Error(String(e)), isLoading: false });
    }
  },

  error: null,

  fetchAllCredentials: async () => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!currentUser || !encryptionKey) {
      set({ credentials: [], error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Get all projects first
      const projectsRef = collection(db, 'users', currentUser.uid, 'projects');
      const projectsSnapshot = await getDocs(projectsRef);
      const fetchedCredentials: DecryptedCredential[] = [];
      
      // Track any decryption errors to report later
      let decryptionErrors = 0;

      // For each project, fetch its credentials
      for (const projectDoc of projectsSnapshot.docs) {
        const credentialsRef = collection(db, 'users', currentUser.uid, 'projects', projectDoc.id, 'credentials');
        const credentialsSnapshot = await getDocs(credentialsRef);
        
        credentialsSnapshot.docs.forEach(docSnap => {
          try {
            const data = docSnap.data() as StoredCredentialData;
            const apiKey = decryptData(data.encryptedApiKey, encryptionKey, data.iv);
            
            // Skip this credential if we couldn't decrypt the API key
            if (apiKey === null) {
              decryptionErrors++;
              console.error(`Failed to decrypt API key for credential ID: ${docSnap.id}. Skipping.`);
              return;
            }
            
            // Try to decrypt optional fields, but don't fail if they can't be decrypted
            const apiSecret = data.encryptedApiSecret ? decryptData(data.encryptedApiSecret, encryptionKey, data.iv) : undefined;
            const notes = data.encryptedNotes ? decryptData(data.encryptedNotes, encryptionKey, data.iv) : undefined;
            
            fetchedCredentials.push({
              apiKey: apiKey,
              apiSecret: apiSecret !== null ? apiSecret : undefined,
              createdAt: data.createdAt as Timestamp,
              id: docSnap.id,
              notes: notes !== null ? notes : undefined,
              projectId: data.projectId,
              serviceName: data.serviceName,
              updatedAt: data.updatedAt as Timestamp,
              userId: data.userId,
            });
          } catch (decryptError) {
            decryptionErrors++;
            console.error(`Error processing credential ${docSnap.id}:`, decryptError);
          }
        });
      }
      
      // Set the credentials we were able to decrypt
      set({ credentials: fetchedCredentials, isLoading: false });
      
      // If we had decryption errors but still got some credentials, show a warning but don't fail
      if (decryptionErrors > 0 && fetchedCredentials.length > 0) {
        console.warn(`Successfully loaded ${String(fetchedCredentials.length)} credentials, but couldn't decrypt ${String(decryptionErrors)} credentials.`);
        // We don't set an error here since we still have some credentials to show
      } else if (decryptionErrors > 0 && fetchedCredentials.length === 0) {
        // Only set an error if all credentials failed to decrypt
        set({ 
          error: new Error(`Failed to decrypt any credentials. Your master password may be incorrect or the data may be corrupted.`),
          isLoading: false 
        });
      }
    } catch (e: unknown) {
      console.error("Error fetching all credentials:", e);
      set({ error: e instanceof Error ? e : new Error(String(e)), isLoading: false });
    }
  },

  fetchCredentials: async (projectId: string) => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!currentUser || !encryptionKey) {
      set({ credentials: [], error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      // Updated path to use nested collections under user and project documents
      const credentialsRef = collection(db, 'users', currentUser.uid, 'projects', projectId, 'credentials');
      const querySnapshot = await getDocs(credentialsRef);
      const fetchedCredentials: DecryptedCredential[] = [];
      
      // Track any decryption errors to report later
      let decryptionErrors = 0;
      
      querySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as StoredCredentialData;
        try {
          const apiKey = decryptData(data.encryptedApiKey, encryptionKey, data.iv);
          
          // Skip this credential if we couldn't decrypt the API key
          if (apiKey === null) {
            decryptionErrors++;
            console.error(`Failed to decrypt API key for credential ID: ${docSnap.id}. Skipping.`);
            return;
          }
          
          // Try to decrypt optional fields, but don't fail if they can't be decrypted
          const apiSecret = data.encryptedApiSecret ? decryptData(data.encryptedApiSecret, encryptionKey, data.iv) : undefined;
          const notes = data.encryptedNotes ? decryptData(data.encryptedNotes, encryptionKey, data.iv) : undefined;
          
          fetchedCredentials.push({
            apiKey: apiKey,
            apiSecret: apiSecret !== null ? apiSecret : undefined,
            createdAt: data.createdAt as Timestamp,
            id: docSnap.id,
            notes: notes !== null ? notes : undefined,
            projectId: data.projectId,
            serviceName: data.serviceName,
            updatedAt: data.updatedAt as Timestamp,
            userId: data.userId,
          });
        } catch (decryptError) {
          decryptionErrors++;
          console.error(`Error processing credential ${docSnap.id}:`, decryptError);
        }
      });
      
      // Set the credentials we were able to decrypt
      set({ credentials: fetchedCredentials, isLoading: false });
      
      // If we had decryption errors but still got some credentials, show a warning but don't fail
      if (decryptionErrors > 0 && fetchedCredentials.length > 0) {
        console.warn(`Successfully loaded ${String(fetchedCredentials.length)} credentials, but couldn't decrypt ${String(decryptionErrors)} credentials.`);
        // We don't set an error here since we still have some credentials to show
      } else if (decryptionErrors > 0 && fetchedCredentials.length === 0) {
        // Only set an error if all credentials failed to decrypt
        set({ 
          error: new Error(`Failed to decrypt any credentials. Your master password may be incorrect or the data may be corrupted.`),
          isLoading: false 
        });
      }
    } catch (e: unknown) {
      console.error("Error fetching credentials:", e);
      set({ error: e instanceof Error ? e : new Error(String(e)), isLoading: false });
    }
  },
  
  isLoading: false,

  resetCorruptedCredential: async (credentialId: string, projectId: string) => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    
    if (!currentUser || !encryptionKey) {
      set({ error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return;
    }
    
    set({ error: null, isLoading: true });
    
    try {
      // Get the corrupted credential
      const credRef = doc(db, 'users', currentUser.uid, 'projects', projectId, 'credentials', credentialId);
      const credSnap = await getDoc(credRef);
      
      if (!credSnap.exists()) {
        throw new Error(`Credential with ID ${credentialId} not found`);
      }
      
      const data = credSnap.data() as StoredCredentialData;
      
      // Create temporary placeholder data for the corrupted credential
      const tempData = {
        apiKey: 'PLACEHOLDER-RESET-VALUE',
        apiSecret: undefined,
        notes: `This credential was reset due to corruption issues on ${new Date().toLocaleString()}. Please update with the correct values.`,
        serviceName: data.serviceName || 'Recovered Credential',
      };
      
      // Generate a fresh IV
      const newIV = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
      
      // Re-encrypt with the current encryption key
      const encryptedApiKey = encryptData(tempData.apiKey, encryptionKey, newIV);
      if (!encryptedApiKey) throw new Error('Failed to encrypt temporary API key');
      
      const encryptedNotes = encryptData(tempData.notes, encryptionKey, newIV);
      if (!encryptedNotes) throw new Error('Failed to encrypt notes');
      
      // Update the credential with the placeholder data
      await updateDoc(credRef, {
        encryptedApiKey: encryptedApiKey.encryptedText,
        encryptedApiSecret: '',  // Clear the secret
        encryptedNotes: encryptedNotes.encryptedText,
        iv: newIV,
        serviceName: tempData.serviceName,
        updatedAt: serverTimestamp(),
      });
      
      // Refresh credentials
      await get().fetchCredentials(projectId);
      
      set({ isLoading: false });
      
    } catch (error) {
      console.error('Error resetting corrupted credential:', error);
      set({ error: new Error('Failed to reset corrupted credential'), isLoading: false });
    }
  },

  updateCredential: async (credentialId: string, currentProjectId: string, data: Partial<Omit<DecryptedCredential, 'createdAt' | 'id' | 'projectId' | 'updatedAt' | 'userId'>>) => {
    const currentUser = auth.currentUser;
    const encryptionKey = useAuthStore.getState().encryptionKey;
    if (!currentUser || !encryptionKey) {
      set({ error: new Error('User not authenticated or master password not set.'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const dataToUpdateFirestore: Partial<StoredCredentialData> = { updatedAt: serverTimestamp() };

      const requiresReEncryption = 'apiKey' in data || 'apiSecret' in data || 'notes' in data;

      if (requiresReEncryption) {
        const currentCredentials = get().credentials;
        const currentDecryptedCredential = currentCredentials.find(c => c.id === credentialId);
        
        if (!currentDecryptedCredential) {
          throw new Error("Original credential not found for update, cannot re-encrypt.");
        }

        const tempDecryptedData = { ...currentDecryptedCredential, ...data };
        
        const newIV = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
        dataToUpdateFirestore.iv = newIV;

        const encryptedApiKey = encryptData(tempDecryptedData.apiKey, encryptionKey, newIV);
        if (!encryptedApiKey) throw new Error('Failed to encrypt API key for update.');
        dataToUpdateFirestore.encryptedApiKey = encryptedApiKey.encryptedText;

        if (tempDecryptedData.apiSecret) {
          const encryptedApiSecret = encryptData(tempDecryptedData.apiSecret, encryptionKey, newIV);
          if (!encryptedApiSecret) throw new Error('Failed to encrypt API secret for update.');
          dataToUpdateFirestore.encryptedApiSecret = encryptedApiSecret.encryptedText;
        } else {
          dataToUpdateFirestore.encryptedApiSecret = '';
        }

        if (tempDecryptedData.notes) {
          const encryptedNotes = encryptData(tempDecryptedData.notes, encryptionKey, newIV);
          if (!encryptedNotes) throw new Error('Failed to encrypt notes for update.');
          dataToUpdateFirestore.encryptedNotes = encryptedNotes.encryptedText;
        } else {
          dataToUpdateFirestore.encryptedNotes = '';
        }
      }

      if (data.serviceName) {
        dataToUpdateFirestore.serviceName = data.serviceName;
      }

      const fieldCountToUpdate = Object.keys(dataToUpdateFirestore).length;
      if (fieldCountToUpdate <= 1 && !dataToUpdateFirestore.updatedAt) {
        console.warn("Update called without changes to actual data fields.");
        set({ isLoading: false });
        return;
      }

      // Updated path to use nested collections
      const credRef = doc(db, 'users', currentUser.uid, 'projects', currentProjectId, 'credentials', credentialId);
      await updateDoc(credRef, dataToUpdateFirestore);
      await get().fetchCredentials(currentProjectId);
      set({ isLoading: false });
    } catch (e: unknown) {
      console.error("Error updating credential:", e);
      set({ error: e instanceof Error ? e : new Error(String(e)), isLoading: false });
    }
  }
}));

// Subscribe to auth changes to clear credentials on logout
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
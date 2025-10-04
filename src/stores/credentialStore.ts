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
import { decryptWithKey, encryptWithKey } from '../services/encryptionService';
import useAuthStore from './authStore'; // To get encryptionKey
import useProjectStore from './projectStore';

// Interface for the raw (decrypted) credential data
export interface DecryptedCredential {
  apiKey: string;
  apiSecret?: string;
  category?: string; // e.g., 'none' | 'frontend' | 'backend' | ...
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
	category?: string; // plaintext categorization, defaults to 'none'
	createdAt: ReturnType<typeof serverTimestamp> | Timestamp; // Allow serverTimestamp on create
	encryptedApiKey: string; // base64 ciphertext (GCM) or CryptoJS base64 (legacy CBC)
	encryptedApiSecret?: string; // base64 ciphertext
	encryptedNotes?: string; // base64 ciphertext
	iv?: string; // Legacy single IV (hex for CBC, or base64 for early GCM refactor)
	ivApiKey?: string; // GCM per-field IV (base64)
	ivApiSecret?: string; // GCM per-field IV (base64)
	ivNotes?: string; // GCM per-field IV (base64)
	projectId: string;
	serviceName: string;
	updatedAt: ReturnType<typeof serverTimestamp> | Timestamp; // Allow serverTimestamp on create/update
	userId: string;
}

// Legacy-aware stored data and helpers
type StoredCredentialDataWithLegacy = StoredCredentialData & {
  category?: string;
  encryptionMeta?: { algo?: string; encryptionStrategy?: string; iv?: string };
  encryptionStrategy?: string;
  public?: boolean;
  teamId?: string;
};

const hasLegacyHints = (obj: unknown): obj is StoredCredentialDataWithLegacy => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    'encryptionStrategy' in o ||
    'encryptionMeta' in o ||
    'teamId' in o ||
    'public' in o
  );
};

// Detects old credentials that were encrypted with the removed "team" strategy
const isLegacyTeamEncryptedCredential = (rawData: unknown): boolean => {
  if (!hasLegacyHints(rawData)) return false;
  const strategy = rawData.encryptionStrategy;
  const metaStrategy = rawData.encryptionMeta?.encryptionStrategy;
  const hasTeamId = typeof rawData.teamId === 'string' && rawData.teamId.length > 0;
  const isPublic = rawData.public === true;
  return strategy === 'team' || metaStrategy === 'team' || hasTeamId || isPublic;
};

// Helper function to convert string to Blob for encryption
const stringToBlob = (text: string): Blob => {
  return new Blob([new TextEncoder().encode(text)], { type: 'text/plain' });
};

// Helper function to convert Blob to string after decryption
const blobToString = async (blob: Blob): Promise<string> => {
  const arrayBuffer = await blob.arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
};

// Helper function to convert Blob to base64 for storage
const blobToBase64 = async (blob: Blob): Promise<string> => {
	const buffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
};

// Helper function to convert base64 to Blob for decryption
const base64ToBlob = (base64: string): Blob => {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return new Blob([bytes], { type: 'application/octet-stream' });
};

// Legacy CBC decrypt using CryptoJS (hex IV, hex key, base64 ciphertext)
const decryptCBC = (cipherBase64: string, keyHex: string, ivHex: string): null | string => {
	try {
		const iv = CryptoJS.enc.Hex.parse(ivHex);
		const key = CryptoJS.enc.Hex.parse(keyHex);
		const decrypted = CryptoJS.AES.decrypt(cipherBase64, key, {
			iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
		});
		const text = decrypted.toString(CryptoJS.enc.Utf8);
		return text || null;
	} catch {
		return null;
	}
};

// Detect legacy IV (32-char hex) used for CBC
const isLegacyHexIV = (iv: unknown): iv is string => {
	return typeof iv === 'string' && /^[0-9a-fA-F]{32}$/.test(iv);
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
      const apiKeyBlob = stringToBlob(data.apiKey);
      const encryptedApiKeyResult = await encryptWithKey(encryptionKey, apiKeyBlob);
      const finalStoredData: StoredCredentialData = {
        category: typeof data.category === 'string' && data.category.length > 0 ? data.category : 'none',
        createdAt: serverTimestamp(),
        encryptedApiKey: await blobToBase64(encryptedApiKeyResult.encryptedBlob),
        ivApiKey: encryptedApiKeyResult.iv,
        projectId: projectId,
        serviceName: data.serviceName,
        updatedAt: serverTimestamp(),
        userId: currentUser.uid,
      };

      if (data.apiSecret) {
        const apiSecretBlob = stringToBlob(data.apiSecret);
        const encryptedSecretResult = await encryptWithKey(encryptionKey, apiSecretBlob);
        finalStoredData.encryptedApiSecret = await blobToBase64(encryptedSecretResult.encryptedBlob);
        finalStoredData.ivApiSecret = encryptedSecretResult.iv;
      }
      
      if (data.notes) {
        const notesBlob = stringToBlob(data.notes);
        const encryptedNotesResult = await encryptWithKey(encryptionKey, notesBlob);
        finalStoredData.encryptedNotes = await blobToBase64(encryptedNotesResult.encryptedBlob);
        finalStoredData.ivNotes = encryptedNotesResult.iv;
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
        
        for (const docSnap of credentialsSnapshot.docs) {
          try {

            const raw = docSnap.data() as StoredCredentialDataWithLegacy;
            const data: StoredCredentialDataWithLegacy = raw;

            const hasPerFieldGcm = typeof data.ivApiKey === 'string' && data.ivApiKey.length > 0;
			const hasSingleIV = typeof data.iv === 'string' && data.iv.length > 0;
			const legacyCBC = !hasPerFieldGcm && hasSingleIV && isLegacyHexIV(data.iv);

			let apiKey: null | string = null;
			let apiSecret: string | undefined;
			let notes: string | undefined;

			if (hasPerFieldGcm && data.ivApiKey) {
				// GCM with per-field IVs, base64 ciphertexts
				const decApiKeyBlob = await decryptWithKey(
					encryptionKey,
					base64ToBlob(data.encryptedApiKey),
					data.ivApiKey
				);
				apiKey = await blobToString(decApiKeyBlob);
				if (data.encryptedApiSecret && data.ivApiSecret) {
					const decApiSecretBlob = await decryptWithKey(
						encryptionKey,
						base64ToBlob(data.encryptedApiSecret),
						data.ivApiSecret
					);
					apiSecret = await blobToString(decApiSecretBlob);
				}
				if (data.encryptedNotes && data.ivNotes) {
					const decNotesBlob = await decryptWithKey(
						encryptionKey,
						base64ToBlob(data.encryptedNotes),
						data.ivNotes
					);
					notes = await blobToString(decNotesBlob);
				}
			} else if (legacyCBC && data.iv) {
				apiKey = decryptCBC(data.encryptedApiKey, encryptionKey, data.iv);
				if (data.encryptedApiSecret) {
					const dec = decryptCBC(data.encryptedApiSecret, encryptionKey, data.iv);
					apiSecret = dec ?? undefined;
				}
				if (data.encryptedNotes) {
					const dec = decryptCBC(data.encryptedNotes, encryptionKey, data.iv);
					notes = dec ?? undefined;
				}
				// Migrate to GCM with per-field IVs
				if (apiKey) {
					const encApiKey = await encryptWithKey(encryptionKey, stringToBlob(apiKey));
					const updates: Partial<StoredCredentialData> = {
						encryptedApiKey: await blobToBase64(encApiKey.encryptedBlob),
						ivApiKey: encApiKey.iv,
						updatedAt: serverTimestamp(),
					};
					if (typeof apiSecret === 'string') {
						const encApiSecret = await encryptWithKey(encryptionKey, stringToBlob(apiSecret));
						updates.encryptedApiSecret = await blobToBase64(encApiSecret.encryptedBlob);
						updates.ivApiSecret = encApiSecret.iv;
					}
					if (typeof notes === 'string') {
						const encNotes = await encryptWithKey(encryptionKey, stringToBlob(notes));
						updates.encryptedNotes = await blobToBase64(encNotes.encryptedBlob);
						updates.ivNotes = encNotes.iv;
					}
					await updateDoc(docSnap.ref, updates);
				}
			} else if (hasSingleIV && data.iv) {
				// Early GCM refactor: single base64 IV for all fields (migrate to per-field)
				const decApiKeyBlob = await decryptWithKey(
					encryptionKey,
					base64ToBlob(data.encryptedApiKey),
					data.iv
				);
				apiKey = await blobToString(decApiKeyBlob);
				if (data.encryptedApiSecret) {
					const decApiSecretBlob = await decryptWithKey(
						encryptionKey,
						base64ToBlob(data.encryptedApiSecret),
						data.iv
					);
					apiSecret = await blobToString(decApiSecretBlob);
				}
				if (data.encryptedNotes) {
					const decNotesBlob = await decryptWithKey(
						encryptionKey,
						base64ToBlob(data.encryptedNotes),
						data.iv
					);
					notes = await blobToString(decNotesBlob);
				}
				// Migrate to per-field IVs
				if (apiKey) {
					const encApiKey = await encryptWithKey(encryptionKey, stringToBlob(apiKey));
					const updates: Partial<StoredCredentialData> = {
						encryptedApiKey: await blobToBase64(encApiKey.encryptedBlob),
						ivApiKey: encApiKey.iv,
						updatedAt: serverTimestamp(),
					};
					if (typeof apiSecret === 'string') {
						const encApiSecret = await encryptWithKey(encryptionKey, stringToBlob(apiSecret));
						updates.encryptedApiSecret = await blobToBase64(encApiSecret.encryptedBlob);
						updates.ivApiSecret = encApiSecret.iv;
					}
					if (typeof notes === 'string') {
						const encNotes = await encryptWithKey(encryptionKey, stringToBlob(notes));
						updates.encryptedNotes = await blobToBase64(encNotes.encryptedBlob);
						updates.ivNotes = encNotes.iv;
					}
					await updateDoc(docSnap.ref, updates);
				}
			}
            // Fallback for legacy team-encrypted credentials: present as placeholder requiring update
            if (!apiKey) {
              if (isLegacyTeamEncryptedCredential(raw)) {
                console.warn(`Legacy team-encrypted credential detected (ID: ${docSnap.id}). Presenting placeholder that requires update.`);
                fetchedCredentials.push({
                  apiKey: 'PLACEHOLDER-RESET-VALUE',
                  apiSecret: undefined,
              category: data.category ?? 'none',
                  createdAt: data.createdAt as Timestamp,
                  id: docSnap.id,
                  notes: undefined,
                  projectId: data.projectId,
                  serviceName: data.serviceName,
                  updatedAt: data.updatedAt as Timestamp,
                  userId: data.userId,
                });
                continue;
              }
              decryptionErrors++;
              console.error(`Failed to decrypt API key for credential ID: ${docSnap.id}. Skipping.`);
              continue;
            }
            
            fetchedCredentials.push({
              apiKey: apiKey,
              apiSecret: apiSecret,
              category: data.category ?? 'none',
              createdAt: data.createdAt as Timestamp,
              id: docSnap.id,
              notes: notes,
              projectId: data.projectId,
              serviceName: data.serviceName,
              updatedAt: data.updatedAt as Timestamp,
              userId: data.userId,
            });
          } catch (decryptError) {
            decryptionErrors++;
            console.error(`Error processing credential ${docSnap.id}:`, decryptError);
          }
        }
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
      
      for (const docSnap of querySnapshot.docs) {
        const raw = docSnap.data() as StoredCredentialDataWithLegacy;
        const data: StoredCredentialDataWithLegacy = raw;
        try {
          const hasPerFieldGcm = typeof data.ivApiKey === 'string' && data.ivApiKey.length > 0;
          const hasSingleIV = typeof data.iv === 'string' && data.iv.length > 0;
          const legacyCBC = !hasPerFieldGcm && hasSingleIV && isLegacyHexIV(data.iv);

          let apiKey: null | string = null;
          let apiSecret: string | undefined;
          let notes: string | undefined;

          if (hasPerFieldGcm && data.ivApiKey) {
            const decApiKeyBlob = await decryptWithKey(encryptionKey, base64ToBlob(data.encryptedApiKey), data.ivApiKey);
            apiKey = await blobToString(decApiKeyBlob);
            if (data.encryptedApiSecret && data.ivApiSecret) {
              const decApiSecretBlob = await decryptWithKey(encryptionKey, base64ToBlob(data.encryptedApiSecret), data.ivApiSecret);
              apiSecret = await blobToString(decApiSecretBlob);
            }
            if (data.encryptedNotes && data.ivNotes) {
              const decNotesBlob = await decryptWithKey(encryptionKey, base64ToBlob(data.encryptedNotes), data.ivNotes);
              notes = await blobToString(decNotesBlob);
            }
          } else if (legacyCBC && data.iv) {
            apiKey = decryptCBC(data.encryptedApiKey, encryptionKey, data.iv);
            if (data.encryptedApiSecret) {
              const dec = decryptCBC(data.encryptedApiSecret, encryptionKey, data.iv);
              apiSecret = dec ?? undefined;
            }
            if (data.encryptedNotes) {
              const dec = decryptCBC(data.encryptedNotes, encryptionKey, data.iv);
              notes = dec ?? undefined;
            }
            if (apiKey) {
              const encApiKey = await encryptWithKey(encryptionKey, stringToBlob(apiKey));
              const updates: Partial<StoredCredentialData> = {
                encryptedApiKey: await blobToBase64(encApiKey.encryptedBlob),
                ivApiKey: encApiKey.iv,
                updatedAt: serverTimestamp(),
              };
              if (typeof apiSecret === 'string') {
                const encApiSecret = await encryptWithKey(encryptionKey, stringToBlob(apiSecret));
                updates.encryptedApiSecret = await blobToBase64(encApiSecret.encryptedBlob);
                updates.ivApiSecret = encApiSecret.iv;
              }
              if (typeof notes === 'string') {
                const encNotes = await encryptWithKey(encryptionKey, stringToBlob(notes));
                updates.encryptedNotes = await blobToBase64(encNotes.encryptedBlob);
                updates.ivNotes = encNotes.iv;
              }
              await updateDoc(docSnap.ref, updates);
            }
          } else if (hasSingleIV && data.iv) {
            const decApiKeyBlob = await decryptWithKey(encryptionKey, base64ToBlob(data.encryptedApiKey), data.iv);
            apiKey = await blobToString(decApiKeyBlob);
            if (data.encryptedApiSecret) {
              const decApiSecretBlob = await decryptWithKey(encryptionKey, base64ToBlob(data.encryptedApiSecret), data.iv);
              apiSecret = await blobToString(decApiSecretBlob);
            }
            if (data.encryptedNotes) {
              const decNotesBlob = await decryptWithKey(encryptionKey, base64ToBlob(data.encryptedNotes), data.iv);
              notes = await blobToString(decNotesBlob);
            }
            if (apiKey) {
              const encApiKey = await encryptWithKey(encryptionKey, stringToBlob(apiKey));
              const updates: Partial<StoredCredentialData> = {
                encryptedApiKey: await blobToBase64(encApiKey.encryptedBlob),
                ivApiKey: encApiKey.iv,
                updatedAt: serverTimestamp(),
              };
              if (typeof apiSecret === 'string') {
                const encApiSecret = await encryptWithKey(encryptionKey, stringToBlob(apiSecret));
                updates.encryptedApiSecret = await blobToBase64(encApiSecret.encryptedBlob);
                updates.ivApiSecret = encApiSecret.iv;
              }
              if (typeof notes === 'string') {
                const encNotes = await encryptWithKey(encryptionKey, stringToBlob(notes));
                updates.encryptedNotes = await blobToBase64(encNotes.encryptedBlob);
                updates.ivNotes = encNotes.iv;
              }
              await updateDoc(docSnap.ref, updates);
            }
          }
          
          // Skip this credential if we couldn't decrypt the API key
          if (!apiKey) { // Changed from apiKey === null || apiKey === ""
            if (isLegacyTeamEncryptedCredential(raw)) {
              console.warn(`Legacy team-encrypted credential detected (ID: ${docSnap.id}). Presenting placeholder that requires update.`);
              fetchedCredentials.push({
                apiKey: 'PLACEHOLDER-RESET-VALUE',
                apiSecret: undefined,
                category: data.category ?? 'none',
                createdAt: data.createdAt as Timestamp,
                id: docSnap.id,
                notes: undefined,
                projectId: data.projectId,
                serviceName: data.serviceName,
                updatedAt: data.updatedAt as Timestamp,
                userId: data.userId,
              });
              continue;
            }
            decryptionErrors++;
            console.error(`Failed to decrypt API key for credential ID: ${docSnap.id}. Skipping.`);
            continue;
          }
          
          fetchedCredentials.push({
            apiKey: apiKey,
            apiSecret: apiSecret,
            category: data.category ?? 'none',
            createdAt: data.createdAt as Timestamp,
            id: docSnap.id,
            notes: notes,
            projectId: data.projectId,
            serviceName: data.serviceName,
            updatedAt: data.updatedAt as Timestamp,
            userId: data.userId,
          });
        } catch (decryptError) {
          decryptionErrors++;
          console.error(`Error processing credential ${docSnap.id}:`, decryptError);
        }
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
        serviceName: data.serviceName,
      };
      
      // Re-encrypt with the current encryption key
      const apiKeyBlob = stringToBlob(tempData.apiKey);
      const encryptedApiKeyResult = await encryptWithKey(encryptionKey, apiKeyBlob);
      const notesBlob = stringToBlob(tempData.notes);
      const encryptedNotesResult = await encryptWithKey(encryptionKey, notesBlob);
      
      // Update the credential with the placeholder data
      await updateDoc(credRef, {
        encryptedApiKey: await blobToBase64(encryptedApiKeyResult.encryptedBlob),
        encryptedApiSecret: '',  // Clear the secret
        encryptedNotes: await blobToBase64(encryptedNotesResult.encryptedBlob),
        iv: encryptedApiKeyResult.iv,
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
        
        // Encrypt with new IV
        const encryptedTempApiKeyResult = await encryptWithKey(encryptionKey, stringToBlob(tempDecryptedData.apiKey));
        dataToUpdateFirestore.iv = encryptedTempApiKeyResult.iv;

        const apiKeyBlob = stringToBlob(tempDecryptedData.apiKey);
        const encryptedApiKeyResult = await encryptWithKey(encryptionKey, apiKeyBlob);
        dataToUpdateFirestore.encryptedApiKey = await blobToBase64(encryptedApiKeyResult.encryptedBlob);

        if (tempDecryptedData.apiSecret) {
          const apiSecretBlob = stringToBlob(tempDecryptedData.apiSecret);
          const encryptedApiSecretResult = await encryptWithKey(encryptionKey, apiSecretBlob);
          dataToUpdateFirestore.encryptedApiSecret = await blobToBase64(encryptedApiSecretResult.encryptedBlob);
        } else {
          dataToUpdateFirestore.encryptedApiSecret = '';
        }

        if (tempDecryptedData.notes) {
          const notesBlob = stringToBlob(tempDecryptedData.notes);
          const encryptedNotesResult = await encryptWithKey(encryptionKey, notesBlob);
          dataToUpdateFirestore.encryptedNotes = await blobToBase64(encryptedNotesResult.encryptedBlob);
        } else {
          dataToUpdateFirestore.encryptedNotes = '';
        }
      }

      if (data.serviceName) {
        dataToUpdateFirestore.serviceName = data.serviceName;
      }

      if ('category' in data) {
        dataToUpdateFirestore.category = (data.category ?? 'none');
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
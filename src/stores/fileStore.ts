import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  deleteObject,
  getBlob,
  ref,
  uploadBytes,
} from "firebase/storage";
import { create } from "zustand";

import { db, storage } from "../firebase";
import {
  decryptWithKey,
  encryptWithKey,
} from "../services/encryptionService";
import { ErrorCategory, logger } from "../services/logger";
import useAuthStore from "./authStore";

// Interface for file metadata stored in Firestore
export interface FileMetadata {
  contentType: string;
  fileName: string;
  id: string;
  isEncrypted: boolean;
  iv?: string; // Stored as base64 string
  projectId: string;
  size: number; // Original file size
  storagePath: string;
  uploadedAt: Timestamp;
  userId: string;
}

// Interface for the file store's state
interface FileStoreState {
  clearFilesOnLogout: () => void;
  deleteFile: (fileMetadata: FileMetadata) => Promise<void>;
  error: Error | null;
  fetchAllFilesForUser: () => Promise<void>;
  fetchFilesForProject: (projectId: string) => Promise<void>;
  fileCache: Record<string, string>; // { [fileId]: objectUrl }
  isLoading: boolean;
  prepareDownloadableFile: (
    fileMetadata: FileMetadata
  ) => Promise<null | string>;
  projectFiles: Record<string, FileMetadata[]>;
  setDecryptedFileUrl: (fileId: string, url: string) => void;
  uploadFile: (
    projectId: string,
    file: File,
    encrypt: boolean
  ) => Promise<void>;
}

const useFileStore = create<FileStoreState>((set, get) => ({
  clearFilesOnLogout: () => {
    // Revoke any cached blob URLs to prevent memory leaks
    Object.values(get().fileCache).forEach((url) => {
      URL.revokeObjectURL(url);
    });
    set({ error: null, fileCache: {}, projectFiles: {} });
  },
  deleteFile: async (fileMetadata: FileMetadata) => {
    const { user } = useAuthStore.getState();
    if (!user || user.uid !== fileMetadata.userId) {
      const e = new Error("User is not authorized to delete this file.");
      set({ error: e });
      throw e;
    }

    set({ error: null, isLoading: true });
    try {
      const storageRef = ref(storage, fileMetadata.storagePath);
      await deleteObject(storageRef);

      const docRef = doc(db, `users/${user.uid}/projects/${fileMetadata.projectId}/files`, fileMetadata.id);
      await deleteDoc(docRef);
      
      set((state) => {
        const updatedFiles = (state.projectFiles[fileMetadata.projectId]).filter(
          (f) => f.id !== fileMetadata.id
        );
        return {
          projectFiles: { ...state.projectFiles, [fileMetadata.projectId]: updatedFiles },
        };
      });
    } catch (error) {
      logger.error(ErrorCategory.UNKNOWN, "Failed to delete file", { error });
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  error: null,
  fetchAllFilesForUser: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ error: null, isLoading: true });
    try {
        const projectsQuery = query(collection(db, `users/${user.uid}/projects`));
        const projectsSnapshot = await getDocs(projectsQuery);
        const allFiles: Record<string, FileMetadata[]> = {};

        for (const projectDoc of projectsSnapshot.docs) {
            const projectId = projectDoc.id;
            const filesQuery = query(collection(db, `users/${user.uid}/projects/${projectId}/files`));
            const filesSnapshot = await getDocs(filesQuery);
            allFiles[projectId] = filesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as FileMetadata));
        }
        
        set({ projectFiles: allFiles });
    } catch (error) {
        logger.error(ErrorCategory.UNKNOWN, "Failed to fetch all user files", { error });
        set({ error: error as Error });
    } finally {
        set({ isLoading: false });
    }
  },

  fetchFilesForProject: async (projectId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ error: null, isLoading: true });
    try {
      const q = query(
        collection(db, `users/${user.uid}/projects/${projectId}/files`)
      );
      const querySnapshot = await getDocs(q);
      const files = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FileMetadata)
      );
      set((state) => ({
        projectFiles: { ...state.projectFiles, [projectId]: files },
      }));
    } catch (error) {
      logger.error(ErrorCategory.UNKNOWN, "Failed to fetch files", { error });
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  fileCache: {},

  isLoading: false,
  
  prepareDownloadableFile: async (fileMetadata) => {
    const { encryptionKey, openMasterPasswordModal } = useAuthStore.getState();
    const { fileCache, setDecryptedFileUrl } = get();

    if (typeof fileCache[fileMetadata.id] !== "undefined") return fileCache[fileMetadata.id];

    if (fileMetadata.isEncrypted && !encryptionKey) {
      openMasterPasswordModal();
      return null;
    }

    set({ error: null, isLoading: true });
    try {
      const storageRef = ref(storage, fileMetadata.storagePath);
      const blob = await getBlob(storageRef);

      let fileBlob: Blob = blob;
      if (fileMetadata.isEncrypted && encryptionKey && fileMetadata.iv) {
        fileBlob = await decryptWithKey(encryptionKey, blob, fileMetadata.iv);
      }
      
      const objectUrl = URL.createObjectURL(fileBlob);
      setDecryptedFileUrl(fileMetadata.id, objectUrl);
      return objectUrl;

    } catch (error) {
      logger.error(ErrorCategory.UNKNOWN, "Error preparing file for download", { error });
      set({ error: error as Error });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  projectFiles: {},

  setDecryptedFileUrl: (fileId, url) => {
    set((state) => ({
      fileCache: { ...state.fileCache, [fileId]: url },
    }));
  },

  uploadFile: async (projectId, file, encrypt) => {
    const { encryptionKey, user } = useAuthStore.getState();
    if (!user) throw new Error("User not authenticated.");
    if (encrypt && !encryptionKey) throw new Error("Encryption key not available.");

    set({ error: null, isLoading: true });
    try {
      let fileToUpload: Blob = file;
      let iv: string | undefined;

      if (encrypt && encryptionKey) {
        const result = await encryptWithKey(encryptionKey, file);
        fileToUpload = result.encryptedBlob;
        iv = result.iv;
      }

      const storagePath = `users/${user.uid}/projects/${projectId}/files/${Date.now().toString()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, fileToUpload);

      const metadata: Omit<FileMetadata, "id" | "uploadedAt"> = {
        contentType: file.type,
        fileName: file.name,
        isEncrypted: encrypt,
        iv,
        projectId,
        size: file.size,
        storagePath,
        userId: user.uid,
      };

      const docRef = await addDoc(
        collection(db, `users/${user.uid}/projects/${projectId}/files`),
        { ...metadata, uploadedAt: serverTimestamp() }
      );
      
      const newFile = { ...metadata, id: docRef.id, uploadedAt: Timestamp.now() } as FileMetadata;
      set((state) => ({
        projectFiles: {
          ...state.projectFiles,
          [projectId]: [...(state.projectFiles[projectId]), newFile],
        },
      }));

    } catch (error) {
      logger.error(ErrorCategory.UNKNOWN, "Error uploading file", { error });
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useFileStore; 
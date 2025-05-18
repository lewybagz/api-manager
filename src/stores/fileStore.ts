import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique file IDs
import { create } from 'zustand';

import { auth, db, storage } from '../firebase'; // Assuming storage is exported from firebase.ts

// Defined in FILE_UPLOAD_PLAN.md
export interface FileMetadata {
  contentType: string;
  fileName: string;
  id: string;
  projectId: string;
  size: number;
  storagePath: string;
  uploadedAt: Timestamp;
  userId: string;
}

interface FileState {
  clearFilesOnLogout: () => void;
  deleteFile: (fileMetadata: FileMetadata) => Promise<boolean>;
  error: Error | null;
  fetchAllFilesForUser: () => Promise<void>;
  fetchFiles: (projectId: string) => Promise<void>;
  getDownloadUrl: (fileMetadata: FileMetadata) => Promise<null | string>;
  isLoading: boolean;
  projectFiles: Record<string, FileMetadata[]>;
  uploadFile: (
    projectId: string,
    file: File,
  ) => Promise<FileMetadata | null>;
}

const useFileStore = create<FileState>((set, get) => ({
  clearFilesOnLogout: () => {
    set({ error: null, isLoading: false, projectFiles: {} });
  },
  deleteFile: async (fileMetadata: FileMetadata) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({
        error: new Error('User not authenticated.'),
        isLoading: false,
      });
      return false;
    }
    if (currentUser.uid !== fileMetadata.userId) {
      set({
        error: new Error(
          'User unauthorized to delete this file.',
        ),
        isLoading: false,
      });
      return false;
    }

    set({ error: null, isLoading: true });
    try {
      const fileStorageRef = ref(storage, fileMetadata.storagePath);
      await deleteObject(fileStorageRef);

      const firestoreDocPath = `users/${currentUser.uid}/projects/${fileMetadata.projectId}/files/${fileMetadata.id}`;
      const fileDocRef = doc(db, firestoreDocPath);
      await deleteDoc(fileDocRef);

      set(state => {
        const updatedFilesForProject = (
          state.projectFiles[fileMetadata.projectId] ?? []
        ).filter(f => f.id !== fileMetadata.id);
        return {
          error: null,
          isLoading: false,
          projectFiles: {
            ...state.projectFiles,
            [fileMetadata.projectId]: updatedFilesForProject,
          },
        };
      });
      return true;
    } catch (e: unknown) {
      set({ error: e as Error, isLoading: false });
      return false;
    }
  },
  error: null,
  fetchAllFilesForUser: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({
        error: new Error('User not authenticated.'),
        isLoading: false,
        projectFiles: {},
      });
      return;
    }

    set({ error: null, isLoading: true });
    const allUserFiles: Record<string, FileMetadata[]> = {};
    try {
      const userProjectsCollectionPath = `users/${currentUser.uid}/projects`;
      const projectsSnapshot = await getDocs(collection(db, userProjectsCollectionPath));

      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        const filesCollectionPath = `users/${currentUser.uid}/projects/${projectId}/files`;
        const filesQuery = query(collection(db, filesCollectionPath), where('userId', '==', currentUser.uid));
        const filesSnapshot = await getDocs(filesQuery);
        
        allUserFiles[projectId] = filesSnapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as FileMetadata));
      }

      set({
        error: null,
        isLoading: false,
        projectFiles: allUserFiles,
      });
    } catch (e: unknown) {
      console.error("[FileStore] Error fetching all files for user:", e);
      set({ error: e as Error, isLoading: false, projectFiles: {} });
    }
  },
  fetchFiles: async (projectId: string) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      set({
        error: new Error('User not authenticated.'),
        isLoading: false,
        projectFiles: { ...get().projectFiles, [projectId]: [] },
      });
      return;
    }

    set({ error: null, isLoading: true });

    try {
      const firestorePath = `users/${currentUser.uid}/projects/${projectId}/files`;
      const filesCollectionRef = collection(db, firestorePath);
      const q = query(filesCollectionRef, where('userId', '==', currentUser.uid));
      
      const querySnapshot = await getDocs(q);

      const filesData: FileMetadata[] = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
        } as FileMetadata;
      });
      
      set(state => ({
        error: null,
        isLoading: false,
        projectFiles: { ...state.projectFiles, [projectId]: filesData },
      }));
    } catch (e: unknown) {
      set({ error: e as Error, isLoading: false });
    }
  },
  getDownloadUrl: async (fileMetadata: FileMetadata) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    if (currentUser.uid !== fileMetadata.userId) {
      return null;
    }

    const storageFileRef = ref(storage, fileMetadata.storagePath);
    const url = await getDownloadURL(storageFileRef);
    return url;
  },
  isLoading: false,
  projectFiles: {},
  uploadFile: async (projectId: string, file: File) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ error: new Error('User not authenticated.'), isLoading: false });
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!file) {
      set({ error: new Error('No file provided.'), isLoading: false });
      return null;
    }

    set({ error: null, isLoading: true });

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileIdForStorage = `${uuidv4()}_${safeFileName}`;
      const storagePath = `users/${currentUser.uid}/projects/${projectId}/files/${fileIdForStorage}`;
      const storageFileRef = ref(storage, storagePath);

      console.log(`[FileStore] Attempting to upload to Storage. File: ${file.name}, Type: ${file.type}, Size: ${String(file.size)}`);
      console.log(`[FileStore] Storage path for upload: ${storagePath}`);

      const uploadResult = await uploadBytes(storageFileRef, file, {
        contentType: file.type,
      });

      console.log(`[FileStore] Successfully uploaded to Storage. Firebase metadata:`, uploadResult.metadata);

      const fileMetadataToSave: Omit<FileMetadata, 'id' | 'uploadedAt'> = {
        contentType: file.type || 'application/octet-stream',
        fileName: file.name,
        projectId,
        size: uploadResult.metadata.size,
        storagePath,
        userId: currentUser.uid,
      };

      console.log('[FileStore] Constructed fileMetadataToSave for Firestore:', JSON.stringify(fileMetadataToSave, null, 2));
      console.log(`[FileStore] Current User UID: ${currentUser.uid}, Project ID: ${projectId}`);
      
      const firestorePath = `users/${currentUser.uid}/projects/${projectId}/files`;
      console.log(`[FileStore] Firestore path for metadata: ${firestorePath}`);
      const filesCollectionRef = collection(db, firestorePath);
      const docRef = await addDoc(filesCollectionRef, {
        ...fileMetadataToSave,
        uploadedAt: serverTimestamp(),
      });

      const newFileDoc: FileMetadata = {
        ...fileMetadataToSave,
        id: docRef.id,
        uploadedAt: Timestamp.now(),
      };

      set(state => ({
        error: null,
        isLoading: false,
        projectFiles: {
          ...state.projectFiles,
          [projectId]: [...(state.projectFiles[projectId] ?? []), newFileDoc],
        },
      }));
      return newFileDoc;
    } catch (e: unknown) {
      set({ error: e as Error, isLoading: false });
      return null;
    }
  },
}));

// Optional: Subscribe to auth changes to clear files on logout
// This could also be done in a component or App.tsx
auth.onAuthStateChanged(user => {
  if (!user) {
    useFileStore.getState().clearFilesOnLogout();
  }
});

export default useFileStore; 
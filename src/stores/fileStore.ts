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

// Utility: Map file extensions to content types
function getContentTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    '7z': 'application/x-7z-compressed',
    // Misc
    'apk': 'application/vnd.android.package-archive',
    'avi': 'video/x-msvideo',
    'bash': 'application/x-sh',
    'bat': 'application/x-bat',
    'bmp': 'image/bmp',
    'bz2': 'application/x-bzip2',
    'c': 'text/x-c',
    'conf': 'text/plain',
    'cpp': 'text/x-c++',
    'cs': 'text/x-csharp',
    'css': 'text/css',
    'csv': 'text/csv',
    'dart': 'text/x-dart',
    'deb': 'application/vnd.debian.binary-package',
    'dll': 'application/x-msdownload',
    'dmg': 'application/x-apple-diskimage',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'env': 'text/x-env',
    'exe': 'application/vnd.microsoft.portable-executable',
    'gif': 'image/gif',
    'go': 'text/x-go',
    'gz': 'application/gzip',
    'h': 'text/x-c',
    'hpp': 'text/x-c++',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'ini': 'text/plain',
    'iso': 'application/x-iso9660-image',
    'java': 'text/x-java-source',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    // Code
    'js': 'application/javascript',
    'json': 'application/json',
    'jsx': 'text/jsx',
    'kt': 'text/x-kotlin',
    'less': 'text/x-less',
    'log': 'text/plain',
    'md': 'text/markdown',
    'mkv': 'video/x-matroska',
    'mov': 'video/quicktime',
    // Audio/video
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'ogg': 'audio/ogg',
    'otf': 'font/otf',
    // Documents
    'pdf': 'application/pdf',
    'php': 'application/x-httpd-php',
    'pl': 'text/x-perl',
    // Images
    'png': 'image/png',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ps1': 'text/x-powershell',
    'py': 'text/x-python',
    'r': 'text/x-r',
    'rar': 'application/vnd.rar',
    'rb': 'text/x-ruby',
    'rpm': 'application/x-rpm',
    'rs': 'text/x-rustsrc',
    'sass': 'text/x-sass',
    'scala': 'text/x-scala',
    'scss': 'text/x-scss',
    'sh': 'application/x-sh',
    'sql': 'application/sql',
    'svelte': 'text/x-svelte',
    'svg': 'image/svg+xml',
    'swift': 'text/x-swift',
    'tar': 'application/x-tar',
    'ts': 'application/typescript',
    'tsx': 'text/tsx',
    // Fonts
    'ttf': 'font/ttf',
    // Text/code
    'txt': 'text/plain',
    'vue': 'text/x-vue',
    'wav': 'audio/wav',
    'webp': 'image/webp',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xml': 'application/xml',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    // Archives
    'zip': 'application/zip',
  };
  return map[ext] ?? 'application/octet-stream';
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
      const files: FileMetadata[] = [];
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const docId = doc.id;
        
        // Detailed logging for each document

        // Basic validation to ensure essential fields exist
        if (data.fileName && data.storagePath && data.contentType) {
          files.push({ id: docId, ...data } as FileMetadata);
        } else {
          // Log malformed documents
          logger.warn(ErrorCategory.VALIDATION, "Skipping malformed file document", undefined, { data, docId });
        }
      });
      
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
      
      // Ensure the Blob used for preview has the correct MIME type (important for SVG rendering)
      const desiredType = fileMetadata.contentType || fileBlob.type;
      const typedBlob = fileBlob.type === desiredType ? fileBlob : new Blob([fileBlob], { type: desiredType });
      const objectUrl = URL.createObjectURL(typedBlob);
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
      const resolvedContentType = getContentTypeFromFilename(file.name);
      // Persist accurate content-type in storage metadata to improve browser handling
      await uploadBytes(fileRef, fileToUpload, { contentType: resolvedContentType });

      const metadata: Omit<FileMetadata, "id" | "iv" | "uploadedAt"> = {
        contentType: resolvedContentType,
        fileName: file.name,
        isEncrypted: encrypt,
        projectId,
        size: file.size,
        storagePath,
        userId: user.uid,
      };

      const dataToWrite = {
        ...metadata,
        uploadedAt: serverTimestamp(),
        ...(iv && { iv }),
      };


      await addDoc(
        collection(db, `users/${user.uid}/projects/${projectId}/files`),
        dataToWrite
      );


      // Re-fetch files for the project to ensure the list is up-to-date
      await get().fetchFilesForProject(projectId);
    } catch (error) {
      logger.error(ErrorCategory.UNKNOWN, "Error uploading file", { error });
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useFileStore; 
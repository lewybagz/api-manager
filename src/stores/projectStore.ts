import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  FieldValue,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  listAll,
  ref as storageRef,
} from 'firebase/storage';
import { create } from 'zustand';

import {
  auth,
  db,
  storage,
} from '../firebase';
import useCredentialStore from './credentialStore';

export type ProjectStatus = 'active' | 'planned' | 'paused' | 'completed' | 'archived';

export interface Project {
  createdAt: null | Timestamp;
  id: string;
  lastCredentialSummary?: {
    addedAt: FieldValue | null | Timestamp;
    serviceName: string;
  };
  lastUpdated?: null | Timestamp;
  projectName: string;
  status: ProjectStatus;
  updatedAt: null | Timestamp;
  userId: string;
}

interface ProjectState {
  addProject: (projectData: { projectName: string; userId: string; status?: ProjectStatus }) => Promise<null | string>;
  clearProjects: () => void;
  deleteProject: (projectId: string) => Promise<void>;
  error: Error | null;
  fetchProjects: () => Promise<void>;
  isLoading: boolean;
  projects: Project[];
  updateProject: (projectId: string, projectData: ProjectUpdateData) => Promise<void>;
}

interface ProjectUpdateData {
  lastCredentialSummary?: {
    addedAt: FieldValue | null | Timestamp;
    serviceName: string;
  };
  projectName?: string;
  status?: ProjectStatus;
}

const useProjectStore = create<ProjectState>((set, get) => ({
  addProject: async (projectData: { projectName: string; userId: string; status?: ProjectStatus }) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== projectData.userId) {
      set({ error: new Error('User not authenticated or mismatched ID'), isLoading: false });
      return null;
    }
    if (!projectData.projectName.trim()) {
      return null;
    }
    set({ error: null, isLoading: true });
    try {
      const projectsRef = collection(db, 'users', currentUser.uid, 'projects');
      const docRef = await addDoc(projectsRef, {
        createdAt: serverTimestamp(),
        lastCredentialSummary: null,
        lastUpdated: serverTimestamp(),
        projectName: projectData.projectName.trim(),
        status: projectData.status ?? 'active',
        updatedAt: serverTimestamp(),
        userId: projectData.userId,
      });
      set({ isLoading: false });
      await get().fetchProjects();
      return docRef.id;
    } catch (e: unknown) {
      console.error("Error adding project:", e);
      set({ error: e as Error, isLoading: false });
      return null;
    }
  },
  clearProjects: () => {
    set({ error: null, isLoading: false, projects: [] });
  },
  deleteProject: async (projectId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ error: new Error('User not authenticated'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const userId = currentUser.uid;

      const projectFilesStoragePath = `users/${userId}/projects/${projectId}/files`;
      const projectFilesStorageRef = storageRef(storage, projectFilesStoragePath);
      const listResults = await listAll(projectFilesStorageRef);
      const deleteFilePromises = listResults.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deleteFilePromises);

      const filesMetadataCollectionRef = collection(db, 'users', userId, 'projects', projectId, 'files');
      const filesQuerySnapshot = await getDocs(filesMetadataCollectionRef);
      if (!filesQuerySnapshot.empty) {
        const batch = writeBatch(db);
        filesQuerySnapshot.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
      }

      await useCredentialStore.getState().deleteCredentialsByProject(projectId);

      const projectRef = doc(db, 'users', userId, 'projects', projectId);
      await deleteDoc(projectRef);
      
      set(state => ({
        isLoading: false,
        projects: state.projects.filter(p => p.id !== projectId),
      }));
    } catch (e: unknown) {
      console.error("Error deleting project, its credentials, and files:", e);
      set({ error: e as Error, isLoading: false });
    }
  },
  error: null,
  fetchProjects: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ error: new Error('User not authenticated'), isLoading: false, projects: [] });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const projectsRef = collection(db, 'users', currentUser.uid, 'projects');
      const querySnapshot = await getDocs(projectsRef);
      const projectsData: Project[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Project, 'id'>),
      }))
      .map(p => ({
        ...p,
        status: (p as Partial<Project>).status ?? 'active',
      }));
      set({ isLoading: false, projects: projectsData });
    } catch (e: unknown) {
      console.error("Error fetching projects:", e);
      set({ error: e as Error, isLoading: false });
    }
  },
  isLoading: false,
  projects: [],
  updateProject: async (projectId: string, projectData: ProjectUpdateData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ error: new Error('User not authenticated'), isLoading: false });
      return;
    }
    if (projectData.projectName?.trim() === '') {
      set({ error: new Error('Project name cannot be empty'), isLoading: false });
      return;
    }
    set({ error: null, isLoading: true });
    try {
      const projectRef = doc(db, 'users', currentUser.uid, 'projects', projectId);
      const updateFields: Record<string, FieldValue | null | object | string> = {
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (projectData.projectName?.trim()) {
        updateFields.projectName = projectData.projectName.trim();
      }
      if (projectData.lastCredentialSummary) {
        updateFields.lastCredentialSummary = projectData.lastCredentialSummary;
      }
      if (projectData.status) {
        updateFields.status = projectData.status;
      }
      await updateDoc(projectRef, updateFields);
      set(state => ({
        isLoading: false,
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                ...(projectData.projectName?.trim() && { projectName: projectData.projectName.trim() }),
                ...(projectData.status && { status: projectData.status }),
                lastUpdated: Timestamp.now(),
                ...(projectData.lastCredentialSummary && { lastCredentialSummary: projectData.lastCredentialSummary }),
                updatedAt: Timestamp.now(),
              }
            : p
        ),
      }));
    } catch (e: unknown) {
      console.error("Error updating project:", e);
      set({ error: e as Error, isLoading: false });
    }
  }
}));

auth.onAuthStateChanged(user => {
  if (!user) {
    useProjectStore.getState().clearProjects();
  }
});

export default useProjectStore; 
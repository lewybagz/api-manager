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
} from 'firebase/firestore';
import { create } from 'zustand';

import { 
  auth, // Auth instance, to get current user if needed for userId
  db // Firestore instance from firebase.ts
} from '../firebase';
import useCredentialStore from './credentialStore'; // Import credential store

export interface Project {
  createdAt: null | Timestamp; // Firestore Timestamp
  id: string; // Firestore document ID
  lastCredentialSummary?: {
    addedAt: FieldValue | null | Timestamp; // Allow serverTimestamp
    serviceName: string;
  };
  lastUpdated?: null | Timestamp; // New: last time any credential was added/updated
  projectName: string;
  updatedAt: null | Timestamp; // Firestore Timestamp
  userId: string;
}

interface ProjectState {
  addProject: (projectData: { projectName: string; userId: string }) => Promise<null | string>; // Returns new project ID or null
  clearProjects: () => void; // To clear projects on logout
  deleteProject: (projectId: string) => Promise<void>;
  error: Error | null;
  fetchProjects: () => Promise<void>;
  isLoading: boolean;
  projects: Project[];
  updateProject: (projectId: string, projectData: ProjectUpdateData) => Promise<void>;
}

interface ProjectUpdateData {
  lastCredentialSummary?: {
    addedAt: FieldValue | null | Timestamp; // Allow serverTimestamp
    serviceName: string;
  };
  projectName?: string;
}

const useProjectStore = create<ProjectState>((set, get) => ({
  addProject: async (projectData: { projectName: string; userId: string }) => {
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
      // Updated path to use nested collection under user document
      const projectsRef = collection(db, 'users', currentUser.uid, 'projects');
      const docRef = await addDoc(projectsRef, {
        createdAt: serverTimestamp(),
        lastCredentialSummary: null,
        lastUpdated: serverTimestamp(),
        projectName: projectData.projectName.trim(),
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
      // First, delete all credentials associated with this project
      await useCredentialStore.getState().deleteCredentialsByProject(projectId);

      // Then, delete the project itself using the new nested path
      const projectRef = doc(db, 'users', currentUser.uid, 'projects', projectId);
      await deleteDoc(projectRef);
      
      set(state => ({
        isLoading: false,
        projects: state.projects.filter(p => p.id !== projectId),
      }));
    } catch (e: unknown) {
      console.error("Error deleting project and its credentials:", e);
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
      // Updated path to use nested collection under user document
      const projectsRef = collection(db, 'users', currentUser.uid, 'projects');
      const querySnapshot = await getDocs(projectsRef);
      const projectsData: Project[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Project, 'id'>)
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
      // Updated path to use nested collection under user document
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
      await updateDoc(projectRef, updateFields);
      set(state => ({
        isLoading: false,
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                ...(projectData.projectName?.trim() && { projectName: projectData.projectName.trim() }),
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

// Subscribe to auth changes to clear projects on logout
// This could also be done in the component that uses both stores (e.g., App.tsx)
// or by making authStore a dependency of projectStore, but this is simpler for now.
auth.onAuthStateChanged(user => {
  if (!user) {
    useProjectStore.getState().clearProjects();
  }
});

export default useProjectStore; 
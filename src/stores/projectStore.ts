import { create } from 'zustand';
import { 
  db, // Firestore instance from firebase.ts
  auth // Auth instance, to get current user if needed for userId
} from '../firebase';
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
  Timestamp // For type hinting
} from 'firebase/firestore';
import useCredentialStore from './credentialStore'; // Import credential store

export interface Project {
  id: string; // Firestore document ID
  userId: string;
  projectName: string;
  createdAt: Timestamp | null; // Firestore Timestamp
  updatedAt: Timestamp | null; // Firestore Timestamp
  lastUpdated?: Timestamp | null; // New: last time any credential was added/updated
  lastCredentialSummary?: {
    serviceName: string;
    addedAt: Timestamp | any; // Allow serverTimestamp
  };
}

interface ProjectUpdateData {
  projectName?: string;
  lastCredentialSummary?: {
    serviceName: string;
    addedAt: Timestamp | any; // Allow serverTimestamp
  };
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  fetchProjects: () => Promise<void>;
  addProject: (projectData: { projectName: string; userId: string }) => Promise<string | null>; // Returns new project ID or null
  updateProject: (projectId: string, projectData: ProjectUpdateData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearProjects: () => void; // To clear projects on logout
}

const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  fetchProjects: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ projects: [], error: new Error('User not authenticated'), isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'projects'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const projectsData: Project[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Project, 'id'>)
      }));
      set({ projects: projectsData, isLoading: false });
    } catch (e: any) {
      console.error("Error fetching projects:", e);
      set({ error: e, isLoading: false });
    }
  },
  addProject: async (projectData: { projectName: string; userId: string }) => {
    const currentUser = auth.currentUser; // Still useful for validation if needed, or remove if userId from projectData is always trusted
    if (!currentUser || currentUser.uid !== projectData.userId) {
      set({ error: new Error('User not authenticated or mismatched ID'), isLoading: false });
      return null;
    }
    if (!projectData.projectName.trim()) {
        return null;
    }
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        userId: projectData.userId,
        projectName: projectData.projectName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastCredentialSummary: null,
      });
      set({ isLoading: false });
      await get().fetchProjects(); 
      return docRef.id;
    } catch (e: any) {
      console.error("Error adding project:", e);
      set({ error: e, isLoading: false });
      return null;
    }
  },
  updateProject: async (projectId: string, projectData: ProjectUpdateData) => {
    if (projectData.projectName !== undefined && !projectData.projectName.trim()) {
      set({ error: new Error('Project name cannot be empty'), isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const projectRef = doc(db, 'projects', projectId);
      const updateFields: any = {
        updatedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      };
      if (projectData.projectName !== undefined && projectData.projectName.trim()) {
        updateFields.projectName = projectData.projectName.trim();
      }
      if (projectData.lastCredentialSummary) {
        updateFields.lastCredentialSummary = projectData.lastCredentialSummary;
      }
      await updateDoc(projectRef, updateFields);
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                ...(projectData.projectName !== undefined && projectData.projectName.trim() && { projectName: projectData.projectName.trim() }),
                updatedAt: Timestamp.now(),
                lastUpdated: Timestamp.now(),
                ...(projectData.lastCredentialSummary && { lastCredentialSummary: projectData.lastCredentialSummary }),
              }
            : p
        ),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error("Error updating project:", e);
      set({ error: e, isLoading: false });
    }
  },
  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      // First, delete all credentials associated with this project
      await useCredentialStore.getState().deleteCredentialsByProject(projectId);

      // Then, delete the project itself
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error("Error deleting project and its credentials:", e);
      set({ error: e, isLoading: false });
    }
  },
  clearProjects: () => {
    set({ projects: [], isLoading: false, error: null });
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
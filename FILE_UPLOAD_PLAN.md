# Project File Upload System Implementation Plan

This document outlines the plan to implement a secure file uploading system for projects within the API Manager application.

## 1. Core Requirements

- **Secure Storage:** Files must be stored securely.
- **Project Association:** Each uploaded file must be strictly associated with a specific project.
- **User-Specific Access:** Users should only be able to access files related to their projects.
- **Diverse File Types:** The system should support uploading and downloading of a wide variety of file types including (but not limited to): `.tsx`, `.jsx`, `.html`, `.css`, `.js`, `.ts`, `.json`, `.md`, `.env`, text files, images, etc.
- **Basic File Operations:** Upload, List, Download, Delete.

## 2. Technology Choices

- **File Storage:** Firebase Storage will be used, leveraging its integration with Firebase Authentication and Firestore, and its robust security rules.
- **Metadata Storage:** Firestore will be used to store metadata about the uploaded files, in a sub-collection under each project.
- **Client-Side Logic:** React components and a Zustand store for state management.

## 3. Detailed Implementation Plan

### 3.1. Firebase Storage Setup

- **Enable Service:** Ensure Firebase Storage is enabled for the Firebase project.
- **Bucket Structure:** Files will be stored using a path structure that ensures project and user isolation:
  `users/{userId}/projects/{projectId}/files/{fileIdWithOriginalName}`
  - `userId`: UID of the user who owns the project.
  - `projectId`: ID of the project the file belongs to.
  - `fileIdWithOriginalName`: A unique ID for the file, potentially prefixed or suffixed with the original filename for easier identification in the storage browser (e.g., `uniqueId_originalFileName.ext`). Using a unique ID ensures that files with the same name can be uploaded without overwriting.
- **Security Rules (`storage.rules`):**
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      // Path: users/{userId}/projects/{projectId}/files/{fileId}
      match /users/{userId}/projects/{projectId}/files/{fileId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId &&
                       request.resource.size < 10 * 1024 * 1024; // Example: 10MB limit per file
        // Allow delete if the user is authenticated and matches the userId in the path.
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
  - These rules ensure only the authenticated owner of a project can read, write, or delete files within their project's designated storage path.
  - Consider adding file size limits (`request.resource.size`).
  - Content type validation (`request.resource.contentType`) can be added if specific restrictions are needed later, but initially, we'll allow broad types.

### 3.2. Firestore Data Model (File Metadata)

- A new sub-collection named `files` will be created under each project document in Firestore.
- Path: `users/{userId}/projects/{projectId}/files/{fileDocId}`
- Each document in this `files` sub-collection will represent an uploaded file and store its metadata.
- **`FileMetadata` Interface:**
  ```typescript
  interface FileMetadata {
    id: string; // Firestore document ID for this metadata entry
    projectId: string; // ID of the parent project
    userId: string; // ID of the user who uploaded
    fileName: string; // Original name of the file (e.g., "config.json")
    storagePath: string; // Full path to the file in Firebase Storage (e.g., "users/uid/projects/pid/files/fid_config.json")
    contentType: string; // MIME type of the file (e.g., "application/json")
    size: number; // File size in bytes
    uploadedAt: Timestamp; // Firestore Timestamp of when the file was uploaded
    // lastModified?: Timestamp; // Optional: if we allow file updates/versions
  }
  ```

### 3.3. State Management (Zustand - `fileStore.ts`)

A new Zustand store (`fileStore.ts`) will be created to manage file-related state and operations.

- **State:**
  - `projectFiles: Record<projectId, FileMetadata[]>`: Cache for files per project.
  - `isLoading: boolean`: For file operations.
  - `error: Error | null`: For file operation errors.
- **Actions:**
  - `uploadFile(projectId: string, file: File): Promise<void>`
    - Requires authenticated user and encryption key (if file contents are to be encrypted client-side before upload - **TBD: for now, no client-side encryption of file contents, rely on Firebase Storage security and HTTPS**).
    - Generates a unique ID for `fileIdWithOriginalName`.
    - Uploads the file to Firebase Storage at the correct path.
    - On successful upload, creates a `FileMetadata` document in Firestore.
    - Updates the local state.
  - `fetchFiles(projectId: string): Promise<void>`
    - Fetches file metadata from the Firestore sub-collection for the given project.
    - Populates `projectFiles` in the state.
  - `getDownloadUrl(fileMetadata: FileMetadata): Promise<string>`
    - Gets a download URL from Firebase Storage for the given `storagePath`.
  - `deleteFile(fileMetadata: FileMetadata): Promise<void>`
    - Deletes the file from Firebase Storage using `storagePath`.
    - Deletes the `FileMetadata` document from Firestore.
    - Updates the local state.
  - `clearFilesOnLogout()`: Clears file state when user logs out.

### 3.4. UI Components (React)

Integrate into `src/pages/ProjectDetailPage.tsx`:

- **`FileUploadArea` Component:**
  - `<input type="file" />` (can be styled).
  - Option for drag-and-drop.
  - Displays selected file name(s), size, type.
  - "Upload" button.
  - Shows progress indicator during upload.
  - Handles errors and success messages (using `sonner` toasts).
- **`FileList` Component:**
  - Displays a list/table of uploaded files for the current project.
  - Columns: File Name, Type (possibly with an icon), Size, Upload Date.
  - Actions per file:
    - Download button (uses `getDownloadUrl` and then triggers browser download).
    - Delete button (with confirmation modal).
  - Handles empty state (no files uploaded).
  - Shows loading state while fetching files.

### 3.5. Integration with Existing Stores/Logic

- **`projectStore.ts`:**
  - When a project is deleted (`deleteProject`), all associated files in Firebase Storage and their metadata in Firestore must also be deleted. This can be done by:
    1.  Querying all `FileMetadata` for the project.
    2.  Iterating through them to delete each file from Storage and then its metadata doc.
    3.  Alternatively, use a Firebase Cloud Function triggered on project document deletion to clean up Storage files (more robust for atomicity but adds complexity). For phase 1, manual iteration in `deleteProject` is acceptable.
- **`authStore.ts`:** Call `fileStore.getState().clearFilesOnLogout()` on user logout.

## 4. Security Considerations (Recap & Additions)

- **Authentication:** All file operations (upload, download, list, delete) must be gated by Firebase Authentication.
- **Authorization:** Firebase Storage security rules are the primary mechanism for ensuring users can only access their own project's files. Firestore security rules for the `files` sub-collection will mirror this.
- **File Naming:** Avoid issues with special characters in filenames or path traversal by sanitizing or using generated IDs for storage paths. The `fileIdWithOriginalName` approach (e.g., `uuid_original.ext`) is good.
- **Content-Type:** Store `contentType` from the `File` object. While not strictly enforcing on upload initially for "any file type," this is useful for future features (e.g., icons, direct rendering of safe types).
- **.env files:** Uploading `.env` files is requested. These are sensitive. Ensure users understand the implications. Files in Firebase Storage are secure if rules are correct, but downloading them means they exist on the user's machine.
- **No Server-Side Processing of Uploaded Files:** Files are stored and retrieved as-is. No server-side execution or transformation that could introduce vulnerabilities.
- **Client-Side Encryption:** For enhanced security, especially for `.env` or other sensitive config files, client-side encryption before upload and decryption after download using the user's master password (or a derivative) could be considered for a future iteration. For this initial implementation, we will rely on Firebase's server-side encryption at rest and HTTPS for transit security.

## 5. Development Steps (Phased Approach)

1.  **Firebase Setup:**
    - Configure Storage rules.
    - Update Firestore rules for the new `files` sub-collection.
2.  **`fileStore.ts` Implementation:**
    - Define `FileMetadata` interface.
    - Implement basic store structure (state, actions: `uploadFile`, `fetchFiles`, `deleteFile`, `getDownloadUrl`).
3.  **UI - `ProjectDetailPage.tsx`:**
    - Add `FileUploadArea` component.
    - Add `FileList` component.
    - Integrate with `fileStore` to display files and allow uploads/downloads/deletions.
4.  **Project Deletion Update:**
    - Modify `projectStore.ts`'s `deleteProject` function to also delete associated files from Storage and Firestore.
5.  **Testing:**
    - Thoroughly test all CRUD operations for files.
    - Test security rules (e.g., try accessing/modifying files of another user if possible in a test environment).
    - Test with various file types and sizes.
    - Test edge cases (network errors, empty project, etc.).
6.  **Documentation:**
    - Update any relevant user-facing documentation or guides.

## 6. Future Enhancements (Post-MVP)

- Client-side encryption/decryption of sensitive files.
- File versioning.
- Direct preview for common safe file types (images, text, PDF).
- More granular Firebase Storage rules (e.g., specific content type restrictions if needed).
- Bulk operations (delete multiple files).
- Search/filter files within a project.

This plan provides a comprehensive roadmap for implementing the file upload feature.

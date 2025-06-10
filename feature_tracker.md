# Zeker API Manager - UX Feature Enhancement Tracker

This document tracks the progress of new UX features being implemented in the Zeker API Manager.

## Feature Prioritization Key

- ⭐ **High Impact / Core to "Zeker"**
- 🟢 **Medium Impact / Significant QoL**
- 🔵 **Lower Impact / Future Considerations**

---

## 1. Visual Feedback for Encryption Status (⭐ High Impact)

- **Status**: [ ] To Do / [x] In Progress / [ ] Done
- **Description**: Implement a small, persistent UI element (e.g., in the main application header or a fixed navigation bar) indicating if the user's session is "Unlocked" (master key in memory, decryption active) or "Locked."
- **Details**:
  - **UI**:
    - Icon-based (e.g., a green open padlock for "Unlocked", a red or grey closed padlock for "Locked").
    - Optional accompanying text like "Unlocked" or "Locked" next to the icon for clarity.
    - Tooltip on hover explaining the current status in more detail (e.g., "Session unlocked. Sensitive data can be decrypted. Session will lock automatically after [X minutes] of inactivity or when you manually lock it." or "Session locked. Enter your master password to decrypt and manage your sensitive data.").
  - **Interactivity**:
    - Clicking the icon when "Unlocked" could offer an option to "Lock Session Now."
    - Clicking the icon when "Locked" could prompt the user to enter their master password or navigate them to the unlock mechanism.
  - **State Management**: This status needs to be tied to the actual state of the master key in the application's memory (e.g., in a Zustand store).
  - **Auto-lock**: Consider an automatic session lock after a configurable period of inactivity (e.g., 15-30 minutes), which would also update this indicator.
- **Benefits**: Provides constant security awareness for the user, reinforces the app's security posture, and offers quick access to lock/unlock actions.
- **Notes/Issues**:
  - Created `src/components/auth/EncryptionStatusIndicator.tsx`.
  - Integrated into `MobileHeader.tsx` and `Sidebar.tsx`.
  - Requires visual and functional testing.

---

## 2. Master Password Strength Indicator & Guidance (⭐ High Impact)

- **Status**: [ ] To Do / [x] In Progress / [ ] Done
- **Description**: When setting or changing the master password, provide a real-time strength meter and actionable advice for creating strong passwords.
- **Details**:
  - **UI Element**:
    - Located directly below the master password input field during signup, master password setup, or change master password flows.
    - Components:
      - A visual strength bar (e.g., color-coded: red, yellow, orange, green).
      - A textual feedback message (e.g., "Weak," "Fair," "Good," "Strong").
      - (Optional) Estimated time to crack.
  - **Guidance**:
    - Display dynamic tips as the user types: "Add more characters," "Include uppercase letters," "Include numbers," "Include symbols," "Avoid common words or sequences."
    - Optionally, link to a brief explanation of "What makes a strong master password?"
  - **Library**: Consider using a library like `zxcvbn-ts` for robust strength estimation.
  - **User Flow**:
    - The indicator and guidance update in real-time as the user types.
    - The "Submit" or "Set Password" button might remain disabled or show a warning if the password strength is below a certain threshold (e.g., "Fair"), potentially allowing override with an explicit acknowledgment of risk.
- **Benefits**: Educates users about password security, encourages stronger master passwords, and directly improves the actual security of their encrypted data.
- **Notes/Issues**:
  - Implemented in `MasterPasswordModal.tsx`.
  - Added custom strength calculation logic (0-4 scale: Very Weak, Weak, Fair, Good, Strong).
  - Displays real-time feedback, a visual strength bar, and actionable suggestions.
  - Prompts for confirmation if the user tries to submit a password rated below "Fair".
  - Submit button disabled if password is "Very Weak".
  - Requires thorough testing of strength logic and UI feedback.

---

## 3. Global Search/Command Palette (🟢 Medium Impact)

- **Status**: [ ] To Do / [ ] In Progress / [ ] Done
- **Description**: Introduce a global search feature (e.g., triggered by Ctrl+K/Cmd+K) allowing users to instantly find and jump to projects, credentials, and files, and execute common actions.
- **Details**:
  - **UI Element**:
    - Trigger: Keyboard shortcut (Cmd+K on macOS, Ctrl+K on Windows/Linux). A clickable search icon in the header could also trigger it.
    - Appearance: A modal dialog that appears centered or at the top of the screen, containing a prominent search input field.
    - Results Area: Dynamically updated list of results as the user types.
  - **Searchable Content**:
    - Projects: By name, description (if any), tags.
    - Credentials: By service name, username (if stored), notes, tags.
    - Files (if file upload feature is implemented): By filename, tags.
    - Actions: "Create New Project," "Add New Credential," "Upload File," "Settings," "Logout," "Lock Session."
  - **Result Display**:
    - Each result should clearly indicate its type (e.g., icon for Project, Key, File, Action).
    - Show primary identifier (e.g., project name) and secondary context (e.g., "Project" or "Credential in Project X").
    - Results should be keyboard navigable (up/down arrows, Enter to select).
  - **Implementation**:
    - Consider a library like `cmdk` or build a custom solution.
    - Data needs to be indexed or readily available in the client's state for quick searching.
- **Benefits**: Drastically improves navigation speed and efficiency, especially for users with many items. Caters to power users and reduces reliance on mouse-driven navigation.
- **Notes/Issues**:

---

## 4. Bulk Operations for Credentials/Projects (🔵 Lower Impact / Future Considerations)

- **Status**: [ ] To Do / [ ] In Progress / [ ] Done
- **Description**: Allow users to select multiple credentials within a project or multiple projects to perform actions like deletion.
- **Details**:
  - **UI Elements**:
    - Selection Mechanism: Checkboxes next to each item in a list (projects, credentials). A "Select All" / "Deselect All" option.
    - Action Bar/Menu: Appears when one or more items are selected, showing available bulk actions (e.g., "Delete Selected," "Archive Selected").
  - **Scope**:
    - **Credentials**: Bulk Delete. Future considerations: Bulk Edit Tags.
    - **Projects**: Bulk Delete. Future considerations: Bulk Archive (move to an "Archived" state, hidden from main list, restorable).
  - **Confirmations**:
    - Crucial for destructive actions like deletion.
    - Modal dialog showing how many items are selected and what action will be performed.
    - May require typing the word "DELETE" or a similar confirmation for extra safety, especially for projects.
  - **Feedback**: Clear progress indicators for bulk operations and success/error messages.
- **Benefits**: Saves significant time for users managing multiple items and improves data management efficiency.
- **Notes/Issues**:

---

## 5. "Recently Accessed" List (🔵 Lower Impact / Future Considerations)

- **Status**: [ ] To Do / [ ] In Progress / [ ] Done
- **Description**: Display a list of recently viewed projects or credentials on the dashboard or sidebar for quick re-access.
- **Details**:
  - **UI Element**:
    - Location: A dedicated section on the main dashboard, or a collapsible section at the top of the sidebar.
    - Appearance: A simple list of links.
    - Content: Show item name and type (e.g., "Project: Acme Corp" or "Credential: AWS Root (Acme Corp)").
  - **Functionality**:
    - Number of Items: Display the last 5-10 recently accessed items (could be configurable).
    - Tracking: When a user navigates to a project detail page or views/decrypts a credential, add it to the top of this list (or update its timestamp).
    - Storage: This list can be stored in browser `localStorage` for simplicity, or in the user's profile in Firestore if persistence across devices is desired.
    - A "Clear List" option could be provided.
- **Benefits**: Quick navigation to frequently or recently used items, reduces clicks and search time, and personalizes the user experience.
- **Notes/Issues**:

---

## 6. Client-Side Encryption for Files (⭐ High Impact)

- **Status**: [ ] To Do / [x] In Progress / [ ] Done
- **Description**: Leverage the existing master password mechanism to encrypt files client-side before upload and decrypt them client-side upon download.
- **Details**:
  - **`fileStore.ts` Modifications**:
    - `FileMetadata` interface updated with `isEncrypted: boolean` and `iv: string` (for Initialization Vector).
    - `uploadFile` action now accepts an `encryptFile: boolean` parameter.
      - If `true` & encryption key available: generates IV, encrypts file content (AES-CBC via CryptoJS), uploads encrypted blob. Stores IV and `isEncrypted: true` in metadata. Original file size and content type are preserved in metadata.
      - If `false` or key unavailable: uploads raw file (current behavior).
    - `getDownloadUrl` renamed to `prepareDownloadableFile`.
      - If `fileMetadata.isEncrypted` is `true`: fetches encrypted blob, decrypts with key & IV. Returns a local object URL to the decrypted blob.
      - If not encrypted: returns direct Firebase Storage URL.
      - Requires `encryptionKey` from `authStore` for decryption; UI will need to handle prompting if key is missing (session locked).
  - **User Flow (Upload)**:
    1.  User selects a file to upload.
    2.  Option presented: "Encrypt this file with your master password?" (checkbox/toggle). Default could be 'on' for certain file types or based on user preference.
    3.  If yes and session is unlocked: File is read, encrypted using AES-256 (derived from master password, unique IV per file), encrypted file is uploaded to Firebase Storage, and metadata (including IV and `encryption_status: "encrypted"`) stored in Firestore.
    4.  If yes and session is locked: Prompt for master password first.
    5.  If no: File uploaded as-is, metadata reflects `encryption_status: "unencrypted"`.
  - **User Flow (Download)**:
    1.  User clicks to download an encrypted file.
    2.  If session is unlocked: Encrypted file downloaded, decrypted in browser using master key and stored IV, then offered to user for download.
    3.  If session is locked: Prompt for master password.
  - **UI Indicators**:
    - In file lists: An icon (e.g., a shield or a different lock icon) next to filenames indicating they are client-side encrypted.
    - During upload: Clear indication of whether encryption will be applied.
  - **Technical Considerations**:
    - Use Web Crypto API for performance and security, especially for streaming encryption/decryption of large files.
    - Key derivation: Use PBKDF2 from master password with a unique salt per user (as per `plan.md`).
- **Benefits**: Massive security enhancement for stored files, aligns perfectly with the "Zeker" brand promise, and gives users ultimate control over their file privacy.
- **Notes/Issues**:
  - Core logic in `fileStore.ts` is implemented.
  - **UI for Upload (`FileUploadArea.tsx`)**:
    - Added "Encrypt file" checkbox.
    - Checkbox state defaults based on sensitive file type (Feature #7) and session lock status.
    - Checkbox disabled if session is locked.
    - Upload is blocked with a prompt to unlock if encryption is chosen while session is locked.
    - `uploadFile` store action is called with the user's encryption choice, driven by manual toggle or modal (Feature #7).
    - Integrated `SensitiveFileWarningModal` for sensitive file handling (see Feature #7 details).
  - UI for download/decryption in `FileList.tsx` and `ProjectFileCard.tsx` (including status display and handling locked sessions) is implemented.

---

## 7. Warning for Sensitive File Types on Upload (⭐ High Impact - Linked with #6)

- **Status**: [ ] To Do / [x] In Progress / [ ] Done
- **Description**: When a user attempts to upload potentially sensitive file types (e.g., .env, .pem, .key), display a confirmation/awareness dialog.
- **Details**:
  - **Detection in `FileUploadArea.tsx`**:
    - A `SENSITIVE_EXTENSIONS` list is defined.
    - When a file is selected, its extension is checked.
    - If sensitive and session is not locked, the "Encrypt file" toggle defaults to `true`.
  - **Modal Implemented (`SensitiveFileWarningModal.tsx`)**:
    - A new modal component created at `src/components/files/SensitiveFileWarningModal.tsx`.
    - Informs user of sensitive file, recommends encryption.
    - Options: "Encrypt and Upload" (disabled if session locked), "Upload without Encryption", "Cancel Upload".
  - **Integration in `FileUploadArea.tsx`**:
    - Modal is displayed if a sensitive file is selected and user hasn't confirmed choice.
    - Callbacks from modal (`onConfirmEncrypt`, `onConfirmUploadWithoutEncryption`, `onCancel`) update encryption choice and trigger upload or cancel action.
    - Manages state to show modal appropriately and respect user's explicit choices.
- **Benefits**: Proactive user education about risks, promotes the use of the client-side file encryption feature, and helps users make informed decisions.
- **Notes/Issues**:
  - Core logic for sensitive file warning and user choice is now implemented in `FileUploadArea.tsx` and `SensitiveFileWarningModal.tsx`.
  - Requires UI/UX testing for the flow of sensitive file detection, modal interaction, and subsequent upload process.

---

## 8. File Type Icons (🟢 Medium Impact)

- **Status**: [ ] To Do / [ ] In Progress / [ ] Done
- **Description**: Display icons corresponding to common file types in file lists.
- **Details**:
  - **UI Element**: Small icons displayed to the left of the filename in any file list (e.g., in Project Detail page's file section, global search results).
  - **Icon Set**:
    - Use a well-known icon library (e.g., Font Awesome, Material Icons) or a dedicated file icon set (e.g., `react-file-icon`).
    - Map common extensions (e.g., `.txt`, `.md`, `.log`, `.js`, `.ts`, `.json`, `.png`, `.jpg`, `.pdf`, `.zip`, `.env`, `.pem`) to specific icons. Include a generic icon for unrecognized types.
  - **Implementation**:
    - A utility function that takes a filename (or MIME type if available from `FileMetadata`) and returns the appropriate icon class or component.
- **Benefits**: Improves scannability of file lists, makes it easier to quickly identify file types, and enhances visual appeal.
- **Notes/Issues**:

---

## 9. Direct Preview for Safe File Types (🔵 Lower Impact / Future Considerations)

- **Status**: [ ] To Do / [ ] In Progress / [ ] Done
- **Description**: Implement in-app previews (modal or side panel) for common "safe" file types like plain text, markdown, JSON, images, and syntax-highlighted code.
- **Details**:
  - **UI Element**:
    - Trigger: A "Preview" button/icon next to files in a list, or automatically loading a preview when a file is selected.
    - Display Area: A modal dialog or a dedicated preview pane within the UI.
  - **Supported Types & Previews**:
    - **Plain Text (`.txt`, `.log` etc.)**: Display as raw text within a scrollable `<pre>` tag.
    - **Markdown (`.md`)**: Render as HTML (e.g., using `react-markdown`). Ensure output is sanitized to prevent XSS.
    - **JSON (`.json`)**: Pretty-print with syntax highlighting (e.g., using `react-json-view` or `JSON.stringify` in a styled `<pre>` tag).
    - **Code Snippets (`.js`, `.ts`, `.py`, etc.)**: Display with syntax highlighting (e.g., using `react-syntax-highlighter`).
    - **Images (`.png`, `.jpg`, `.gif`, `.svg`, `.webp`)**: Display directly using an `<img>` tag.
    - **PDF (`.pdf`)**: Embed using `<embed>`, `<iframe>`, or a library like `react-pdf`.
  - **Security**:
    - For HTML/SVG previews from user-uploaded content (even their own), sanitize vigorously or use sandboxed iframes to mitigate XSS risks.
    - For client-side encrypted files, decryption (as per Feature #6) must happen before preview.
  - **Considerations**:
    - Implement a maximum file size for previews to prevent browser performance issues.
    - Show loading states while files are fetched/decrypted/rendered.
    - Include "Download" or "Open in New Tab" options from the preview.
- **Benefits**: Saves users time by avoiding the need to download files to view their contents. Improves workflow when dealing with configuration files, notes, or code snippets.
- **Notes/Issues**:

---

**1. Core Functionality:**

- **User Authentication:** Secure login/signup (Firebase Auth).
- **Project Management:** CRUD operations for projects.
- **API Credential Management:** CRUD operations for API keys/secrets, organized under projects.
- **Encryption/Decryption:** Client-side AES-256 encryption of credentials before storing in Firebase, and decryption on retrieval. The encryption key will be derived from a user-provided master password (using PBKDF2) and held in memory during the session.
- **Search/Filter:** Basic search for projects.

**2. Technology Stack:**

- **Frontend:**
  - Framework: React (with TypeScript)
  - Build Tool: Vite
  - Styling: Tailwind CSS
  - State Management: Zustand (or React Context API)
  - Routing: React Router
  - Forms: React Hook Form
- **Backend-as-a-Service (BaaS):**
  - Firebase:
    - Firebase Authentication (for user management)
    - Cloud Firestore (NoSQL database for encrypted data)
- **Encryption Library:**
  - `crypto-js` (or Web Crypto API) for AES-256 encryption.

**3. Frontend Design (UI/UX):**

- **Theme:** Dark mode - black/grey backgrounds with blue accents for interactive elements.
- **Layout:**
  - Sidebar: For project navigation.
  - Main Content Area: Displays credentials, forms.
- **Key Components:** Login/Signup, Dashboard (project list, add project), Project View (credential list, add credential), Modals for forms.
- **UX:** Masked credentials with "Show/Hide" and "Copy to Clipboard" functionality. Clear user feedback and loading states.

**4. Backend/Database Structure (Cloud Firestore):**

- **Collections:**
  - `projects`: (Fields: `userId`, `projectName`, `createdAt`, `updatedAt`)
  - `credentials`: (Fields: `userId`, `projectId`, `serviceName`, `encryptedApiKey`, `encryptedApiSecret` (optional), `encryptedNotes` (optional), `iv`, `createdAt`, `updatedAt`)
- **Security Rules:** Firestore rules to ensure users can only access and modify their own data.

**5. Encryption Strategy:**

- **Algorithm:** AES-256.
- **Key Source:** Derived from a user's master password using PBKDF2 and a unique salt per user (salt stored in Firestore). The derived key is session-based and not stored persistently.
- **Process:**
  - Generate a unique Initialization Vector (IV) for each encryption operation.
  - Store encrypted data and IV in Firestore.
  - Prompt for master password to re-derive key if not in session for decryption.

**6. Development Phases:**

- **Phase 0: Setup & Basic Structure:**
  - Firebase project setup.
  - React + TypeScript + Vite project initialization.
  - Install core dependencies.
  - ESLint setup (using your provided configuration).
  - Basic routing and layout components.
- **Phase 1: Authentication:**
  - Firebase Auth implementation.
  - Protected routes.
  - Master password input and key derivation logic.
- **Phase 2: Project Management:**
  - Firestore `projects` collection setup.
  - UI and Firestore integration for project CRUD.
- **Phase 3: Credential Management:**
  - Firestore `credentials` collection setup.
  - UI for credential CRUD (with client-side encryption/decryption).
  - "Copy to Clipboard" feature.
- **Phase 4: Styling & UX Refinements:**
  - Apply Tailwind CSS for the black/grey/blue theme.
  - Enhance UI/UX (loading states, error handling).
  - Ensure responsiveness.
- **Phase 5: Security & Testing:**
  - Test encryption/decryption thoroughly.
  - Implement and test Firebase Security Rules.
  - Write tests for critical logic.
- **Phase 6: Deployment (Optional):**
  - Deploy to Vercel, Netlify, or Firebase Hosting.

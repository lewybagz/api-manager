import { Timestamp } from "firebase/firestore";

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  roles: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserWithAuth extends UserDocument {
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

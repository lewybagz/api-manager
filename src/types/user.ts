import { Timestamp } from "firebase/firestore";

export interface UserDocument {
  createdAt: Timestamp;
  displayName: null | string;
  email: string;
  roles: string[];
  uid: string;
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

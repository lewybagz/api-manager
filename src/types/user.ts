import { Timestamp } from "firebase/firestore";

export type AppType = 'api' | 'pw';

export interface UserDocument {
  appType?: AppType;
  billing?: {
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Timestamp;
    planId?: string;
    priceId?: string;
    status?: 'active' | 'canceled' | 'incomplete' | 'none' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  createdAt: Timestamp;
  displayName: null | string;
  email: string;
  entitlements?: string[];
  roles: string[];
  // Optional billing/trial fields managed by backend
  trialEndsAt?: Timestamp;
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

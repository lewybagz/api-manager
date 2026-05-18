import { doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';

import { auth, db } from '../firebase';
import { ErrorCategory, logger } from '../services/logger';

interface RateLimitAttempt {
  count: number;
  lastAttempt: Timestamp;
  updatedAt?: Timestamp;
}

interface RateLimitData {
  attempts: number;
  lastAttempt: null | Timestamp;
}

interface RateLimitState {
  checkAndConsumeDaily: (key: string, limitPerDay: number) => Promise<boolean>;
  addFailedAttempt: (email: string) => Promise<void>;
  failedAttempts: Record<string, RateLimitAttempt>;
  getRemainingLockoutTime: (email: string) => Promise<number>;
  isRateLimited: (email: string) => Promise<boolean>;
  lockoutDuration: number; // in milliseconds
  maxAttempts: number;
  resetAttempts: (email: string) => Promise<void>;
}

/**
 * Sanitize an email address to make it a valid Firestore document ID
 * @param email The email address to sanitize
 * @returns A sanitized string that can be used as a Firestore document ID
 */
export function sanitizeEmailForDocId(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  // Replace periods, @ symbol, and other special characters that are not allowed in Firestore document IDs
  return email.replace(/[.@#$[\]/]/g, '_').toLowerCase();
}

const useRateLimitStore = create<RateLimitState>((_set, get) => ({
  checkAndConsumeDaily: async (key: string, limitPerDay: number) => {
    try {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const dayKey = `${y}-${m}-${d}`;
      const ref = doc(db, 'dailyLimits', `${key}:${dayKey}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { count: 1, date: serverTimestamp() });
        return true;
      }
      const count = (snap.data() as { count?: number }).count ?? 0;
      if (count >= limitPerDay) return false;
      await updateDoc(ref, { count: count + 1, date: serverTimestamp() });
      return true;
    } catch {
      return false;
    }
  },
  addFailedAttempt: async (email: string) => {
    if (!email || email.trim() === '') {
      logger.error(ErrorCategory.VALIDATION, "Error adding failed attempt: Email cannot be empty");
      return;
    }
    
    try {
      // Use sanitized email as document ID
      const sanitizedEmail = sanitizeEmailForDocId(email);
      
      // Validate sanitized email
      if (!sanitizedEmail) {
        logger.error(ErrorCategory.VALIDATION, "Invalid email format for rate limiting");
        return;
      }
      
      const rateLimitRef = doc(db, "rateLimits", sanitizedEmail);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      if (!rateLimitDoc.exists()) {
        await setDoc(rateLimitRef, {
          attempts: 1,
          lastAttempt: serverTimestamp(),
        });
        logger.info(ErrorCategory.AUTH, "Created new rate limit record", { email: sanitizedEmail });
        return;
      }
      
      const data = rateLimitDoc.data() as RateLimitData;
      const attempts = data.attempts + 1;
      
      await updateDoc(rateLimitRef, {
        attempts,
        lastAttempt: serverTimestamp(),
      });
      
      logger.info(ErrorCategory.AUTH, "Updated rate limit record", { 
        attempts,
        email: sanitizedEmail
      });
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error adding failed attempt", { error });
    }
  },
  
  failedAttempts: {},
  
  getRemainingLockoutTime: async (email: string): Promise<number> => {
    if (!email || email.trim() === '') {
      return 0;
    }
    
    try {
      // Use sanitized email as document ID
      const sanitizedEmail = sanitizeEmailForDocId(email);
      
      // Validate sanitized email
      if (!sanitizedEmail) {
        logger.error(ErrorCategory.VALIDATION, "Invalid email format for rate limiting");
        return 0;
      }
      
      const rateLimitRef = doc(db, "rateLimits", sanitizedEmail);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      if (!rateLimitDoc.exists()) return 0;
      
      const data = rateLimitDoc.data() as RateLimitData;
      
      // If lastAttempt is null or undefined, return 0
      if (!data.lastAttempt) return 0;
      
      const lastAttempt = data.lastAttempt.toDate().getTime();
      const remainingTime = get().lockoutDuration - (Date.now() - lastAttempt);
      return Math.max(0, remainingTime);
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error getting remaining lockout time", { error });
      return 0;
    }
  },

  isRateLimited: async (email: string): Promise<boolean> => {
    if (!email || email.trim() === '') {
      return false;
    }
    
    try {
      // Use sanitized email as document ID
      const sanitizedEmail = sanitizeEmailForDocId(email);
      
      // Validate sanitized email
      if (!sanitizedEmail) {
        logger.error(ErrorCategory.VALIDATION, "Invalid email format for rate limiting");
        return false;
      }
      
      const rateLimitRef = doc(db, "rateLimits", sanitizedEmail);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      if (!rateLimitDoc.exists()) return false;
      
      const data = rateLimitDoc.data() as RateLimitData;
      
      // If lastAttempt is null or undefined, user is not rate limited
      if (!data.lastAttempt) return false;
      
      // Convert Timestamp to milliseconds for comparison
      const lastAttemptTime = data.lastAttempt.toDate().getTime();
      const lockoutExpiry = Date.now() - get().lockoutDuration;
      
      return data.attempts >= get().maxAttempts && lastAttemptTime > lockoutExpiry;
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error checking rate limit", { error });
      return false;
    }
  },

  lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds

  maxAttempts: 5,

  resetAttempts: async (email: string): Promise<void> => {
    if (!email || email.trim() === '') {
      return;
    }
    
    try {
      // Use sanitized email as document ID
      const sanitizedEmail = sanitizeEmailForDocId(email);
      
      // Validate sanitized email
      if (!sanitizedEmail) {
        logger.error(ErrorCategory.VALIDATION, "Invalid email format for rate limiting");
        return;
      }
      
      const rateLimitRef = doc(db, "rateLimits", sanitizedEmail);
      await setDoc(rateLimitRef, {
        attempts: 0,
        lastAttempt: serverTimestamp(),
      });
      
      logger.info(ErrorCategory.AUTH, "Reset rate limit attempts", { email: sanitizedEmail });
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error resetting attempts", { error });
    }
  },
}));

// Subscribe to auth changes to clear rate limit data on logout
auth.onAuthStateChanged(user => {
  if (!user) {
    useRateLimitStore.getState().failedAttempts = {};
  }
});

export default useRateLimitStore; 
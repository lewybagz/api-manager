import { create } from "zustand";

import { auth } from "../firebase";
import { apiPostJson, getIdTokenOrNull } from "../services/apiClient";
import { ErrorCategory, logger } from "../services/logger";

interface RateLimitAttempt {
  count: number;
  lastAttempt: number;
}

interface RateLimitState {
  checkAndConsumeDaily: (key: string, limitPerDay: number) => Promise<boolean>;
  addFailedAttempt: (email: string) => Promise<void>;
  failedAttempts: Record<string, RateLimitAttempt>;
  getRemainingLockoutTime: (email: string) => Promise<number>;
  isRateLimited: (email: string) => Promise<boolean>;
  lockoutDuration: number;
  maxAttempts: number;
  resetAttempts: (email: string) => Promise<void>;
}

/**
 * Sanitize an email address to make it a valid Firestore document ID
 * (kept for callers that reference the helper).
 */
export function sanitizeEmailForDocId(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }
  return email.replace(/[.@#$[\]/]/g, "_").toLowerCase();
}

const useRateLimitStore = create<RateLimitState>((_set, get) => ({
  checkAndConsumeDaily: async (key: string, limitPerDay: number) => {
    try {
      const token = await getIdTokenOrNull();
      if (!token) return false;
      const result = await apiPostJson<{ ok: boolean }>(
        "/api/rate-limit/daily",
        { key, limitPerDay },
        { token }
      );
      return result.ok;
    } catch {
      return false;
    }
  },

  addFailedAttempt: async (email: string) => {
    if (!email || email.trim() === "") {
      logger.error(
        ErrorCategory.VALIDATION,
        "Error adding failed attempt: Email cannot be empty"
      );
      return;
    }

    try {
      await apiPostJson("/api/rate-limit/failed-attempt", { email });
      logger.info(ErrorCategory.AUTH, "Recorded failed login attempt");
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error adding failed attempt", { error });
    }
  },

  failedAttempts: {},

  getRemainingLockoutTime: async (email: string): Promise<number> => {
    if (!email || email.trim() === "") return 0;

    try {
      const result = await apiPostJson<{ remainingLockoutMs: number }>(
        "/api/rate-limit/status",
        {
          email,
          lockoutMs: get().lockoutDuration,
          maxAttempts: get().maxAttempts,
        }
      );
      return result.remainingLockoutMs ?? 0;
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error getting remaining lockout time", {
        error,
      });
      return 0;
    }
  },

  isRateLimited: async (email: string): Promise<boolean> => {
    if (!email || email.trim() === "") return false;

    try {
      const result = await apiPostJson<{ isRateLimited: boolean }>(
        "/api/rate-limit/status",
        {
          email,
          lockoutMs: get().lockoutDuration,
          maxAttempts: get().maxAttempts,
        }
      );
      return Boolean(result.isRateLimited);
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error checking rate limit", { error });
      return false;
    }
  },

  lockoutDuration: 15 * 60 * 1000,

  maxAttempts: 5,

  resetAttempts: async (email: string): Promise<void> => {
    if (!email || email.trim() === "") return;

    try {
      await apiPostJson("/api/rate-limit/reset", { email });
      logger.info(ErrorCategory.AUTH, "Reset rate limit attempts");
    } catch (error) {
      logger.error(ErrorCategory.AUTH, "Error resetting attempts", { error });
    }
  },
}));

auth.onAuthStateChanged((user) => {
  if (!user) {
    useRateLimitStore.getState().failedAttempts = {};
  }
});

export default useRateLimitStore;

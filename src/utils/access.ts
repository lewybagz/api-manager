import type { UserDocument } from '../types/user';

export function trialDaysRemaining(userDoc: null | UserDocument): number {
  if (!userDoc?.trialEndsAt) return 0;
  const remainingMs = userDoc.trialEndsAt.toMillis() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export function userHasAccess(userDoc: null | UserDocument): boolean {
  if (!userDoc) return false;

  const nowMs = Date.now();
  const trialOk = userDoc.trialEndsAt ? userDoc.trialEndsAt.toMillis() > nowMs : false;
  const status = userDoc.billing?.status;
  const periodEndMs = userDoc.billing?.currentPeriodEnd?.toMillis();
  const isActive = status === 'active' || status === 'trialing';

  if (trialOk) return true;
  if (isActive) {
    // If cancelAtPeriodEnd=true, still valid until currentPeriodEnd
    if (userDoc.billing?.cancelAtPeriodEnd && periodEndMs) {
      return periodEndMs > nowMs;
    }
    return true;
  }

  return false;
}

export function userHasAccessOrBypass(userDoc: null | UserDocument): boolean {
  if (!userDoc) return false;

  const bypassEnv = import.meta.env.VITE_PAYWALL_BYPASS_EMAILS as
    | string
    | undefined;
  const bypass = (bypassEnv ? bypassEnv.split(",") : [])
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = userDoc.email?.toLowerCase();
  const isBypassed = email ? bypass.includes(email) : false;

  return isBypassed || userHasAccess(userDoc);
}



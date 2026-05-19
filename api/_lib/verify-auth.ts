import type { VercelRequest } from "@vercel/node";

import { getAuth } from "./firebase-admin";

export type VerifiedAuth = { uid: string };

export async function verifyBearerToken(
  req: VercelRequest
): Promise<VerifiedAuth | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

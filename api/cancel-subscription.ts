import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

import admin from "firebase-admin";

import { FieldValue, getFirestore } from "./_lib/firebase-admin";
import { jsonError, methodNotAllowed } from "./_lib/http";
import { verifyBearerToken } from "./_lib/verify-auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  try {
    const auth = await verifyBearerToken(req);
    if (!auth) {
      jsonError(res, 401, "Missing Authorization bearer token");
      return;
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      jsonError(res, 500, "Missing Stripe configuration");
      return;
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
    const db = getFirestore();
    const userRef = db.collection("users").doc(auth.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      jsonError(res, 404, "User not found");
      return;
    }

    const data = snap.data() as {
      billing?: { stripeSubscriptionId?: string };
    };
    const subscriptionId = data?.billing?.stripeSubscriptionId;
    if (!subscriptionId) {
      jsonError(res, 400, "No active subscription to cancel");
      return;
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await userRef.update({
      "billing.cancelAtPeriodEnd": true,
      "billing.currentPeriodEnd": admin.firestore.Timestamp.fromMillis(
        updated.current_period_end * 1000
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ ok: true, subscriptionId });
  } catch (e) {
    console.error("cancel-subscription error", e);
    jsonError(res, 500, "Internal error");
  }
}

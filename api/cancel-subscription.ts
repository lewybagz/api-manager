import { type VercelRequest, type VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import admin from 'firebase-admin';

let app: admin.app.App | null = null;
function getAdminApp() {
  if (app) return app;
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    app = admin.app();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing Authorization bearer token' });
      return;
    }
    const idToken = authHeader.slice('Bearer '.length);

    const app = getAdminApp();
    const auth = app.auth();
    const db = app.firestore();

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      res.status(500).json({ error: 'Missing Stripe configuration' });
      return;
    }
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const data = snap.data() as any;
    const subscriptionId: string | undefined = data?.billing?.stripeSubscriptionId;
    if (!subscriptionId) {
      res.status(400).json({ error: 'No active subscription to cancel' });
      return;
    }

    // Set cancel_at_period_end instead of immediate cancel
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await userRef.update({
      'billing.cancelAtPeriodEnd': true,
      'billing.currentPeriodEnd': admin.firestore.Timestamp.fromMillis(updated.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ ok: true, subscriptionId });
  } catch (e) {
    console.error('cancel-subscription error', e);
    res.status(500).json({ error: 'Internal error' });
  }
}



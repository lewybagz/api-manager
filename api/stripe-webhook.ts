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
    res.status(405).send('Method Not Allowed');
    return;
  }

  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!signingSecret || !stripeSecretKey) {
    res.status(500).send('Missing Stripe environment configuration');
    return;
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: Stripe.Event;
  try {
    // Read raw body for signature verification
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);
    event = stripe.webhooks.constructEvent(rawBody, sig, signingSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  const app = getAdminApp();
  const db = app.firestore();

  async function upsertUserByEmail(email: string, updater: (ref: FirebaseFirestore.DocumentReference) => Promise<void>) {
    const usersRef = db.collection('users');
    const snap = await usersRef.where('email', '==', email).limit(1).get();
    if (snap.empty) return;
    const ref = snap.docs[0].ref;
    await updater(ref);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const price = sub.items.data[0]?.price;
        const proAnnualId = process.env.STRIPE_PRICE_PRO_ANNUAL;
        const mappedPlanId = proAnnualId && price?.id === proAnnualId ? 'pro_annual' : (price?.nickname || undefined);
        let email: string | null = (sub as any).customer_email || null;
        if (!email) {
          if (typeof sub.customer === 'string') {
            const customer = await stripe.customers.retrieve(sub.customer);
            if (!('deleted' in customer) || !customer.deleted) {
              email = customer.email ?? null;
            }
          } else if (sub.customer && !('deleted' in sub.customer)) {
            email = (sub.customer as Stripe.Customer).email ?? null;
          }
        }
        if (!email) break;
        await upsertUserByEmail(email, async (ref) => {
          await ref.update({
            billing: {
              status: sub.status === 'trialing' ? 'trialing' : (sub.status === 'active' ? 'active' : sub.status),
              planId: mappedPlanId,
              priceId: price?.id,
              stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
              stripeSubscriptionId: sub.id,
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const price = sub.items.data[0]?.price;
        const proAnnualId = process.env.STRIPE_PRICE_PRO_ANNUAL;
        const mappedPlanId = proAnnualId && price?.id === proAnnualId ? 'pro_annual' : (price?.nickname || undefined);
        let email: string | null = (sub as any).customer_email || null;
        if (!email) {
          if (typeof sub.customer === 'string') {
            const customer = await stripe.customers.retrieve(sub.customer);
            if (!('deleted' in customer) || !customer.deleted) {
              email = customer.email ?? null;
            }
          } else if (sub.customer && !('deleted' in sub.customer)) {
            email = (sub.customer as Stripe.Customer).email ?? null;
          }
        }
        if (!email) break;
        await upsertUserByEmail(email, async (ref) => {
          await ref.update({
            billing: {
              status: 'canceled',
              planId: mappedPlanId,
              priceId: price?.id,
              stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
              stripeSubscriptionId: sub.id,
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
              cancelAtPeriodEnd: true,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email as string;
        if (!email) break;
        await upsertUserByEmail(email, async (ref) => {
          await ref.update({
            'billing.status': 'past_due',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Webhook handling error', e);
    res.status(500).send('Webhook handler error');
    return;
  }

  res.status(200).json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};



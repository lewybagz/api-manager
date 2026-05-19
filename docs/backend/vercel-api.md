# Vercel API (server routes)

Server-side logic lives under `api/` and deploys as Vercel Functions.

The SPA resolves logical paths like `/api/cancel-subscription` to **`/internal/zeker/api/...`** via [`src/services/apiClient.ts`](../../src/services/apiClient.ts) (`API_BASE` in [`src/config/paths.ts`](../../src/config/paths.ts)). See [`docs/ZEKER_INTEGRATION.md`](../ZEKER_INTEGRATION.md) for portfolio proxying.

## Environment variables

Set these in the Vercel project (Production + Preview as needed):

| Variable | Used by |
| -------- | ------- |
| `STRIPE_SECRET_KEY` | Stripe webhook, cancel subscription |
| `STRIPE_WEBHOOK_SECRET` | `api/stripe-webhook.ts` |
| `STRIPE_PRICE_PRO_ANNUAL` | Webhook plan mapping |
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account for Admin SDK (preferred on Vercel) |
| — or — `GOOGLE_APPLICATION_CREDENTIALS` / Firebase integration | `applicationDefault()` fallback |

## Routes

| Path | Auth | Purpose |
| ---- | ---- | ------- |
| `POST /api/stripe-webhook` | Stripe signature | Subscription billing sync |
| `POST /api/cancel-subscription` | Bearer Firebase ID token | Cancel at period end |
| `POST /api/pw/merge-tags` | Bearer | Merge password tags |
| `POST /api/rate-limit/failed-attempt` | Public (email in body) | Login failed attempt |
| `POST /api/rate-limit/status` | Public | Lockout status |
| `POST /api/rate-limit/reset` | Public | Reset attempts after success |
| `POST /api/rate-limit/daily` | Bearer | Daily quota consume |

Firestore `rateLimits` and `dailyLimits` are **denied** to clients; only Admin SDK on Vercel may write them.

## Local development

1. `vercel dev` (default port **3000**) — serves `/api/*`
2. `npm run dev` — Vite proxies `/api` to `http://127.0.0.1:3000` (see `vite.config.ts`)

Provide the same env vars via `.env.local` for `vercel dev` or link the Vercel project.

## Decommissioning Firebase Cloud Functions

After deploy, remove legacy functions in Firebase Console (or `firebase functions:delete pw_mergeTags` etc.). The `functions/` directory has been removed from this repo.

## Manual test checklist

- [ ] Merge two tags — passwords retagged, source tag removed
- [ ] Add/edit password tags — `usageCount` updates without Cloud Function
- [ ] Failed login lockout still works
- [ ] Stripe webhook updates `users.billing`
- [ ] Cancel subscription from subscription management page
- [ ] Production Network tab — no `cloudfunctions.net` requests

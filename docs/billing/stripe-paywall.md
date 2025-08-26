## Stripe Paywall Integration Plan

### Overview

Introduce a subscription paywall using Stripe. Users get access if they are within a 7‑day trial window or have an active subscription. We will gate access in the UI, add billing fields to `users/{uid}`, and process Stripe webhooks to keep state in sync.

### Current System Summary

- Auth: Firebase Auth with `useAuthStore` and guards (`AuthGuard`, `ProtectedRoute`).
- Encryption: AES‑GCM client‑side, key derived via PBKDF2; keys not persisted.
- Data: Firestore `users/{uid}` documents without billing fields yet.
- Stripe: No existing code.

### Decisions Locked‑in

- Pricing: USD $4.99 per month, billed yearly as a single charge of $59.88 USD.
- Trial strategy: App‑managed 7‑day trial (set `trialEndsAt` in the user doc on creation/first login).
- App domain for redirects: `https://zekerkey.com`.
- Stripe Payment Link URL(s): https://buy.stripe.com/9B68wO1Lx0jz4sAfTWbbG03

## Architecture

### Access Logic

User has access if one of the following holds:

- now < `trialEndsAt` (app‑managed trial), or
- `billing.status` in {'active','trialing'} and period not ended.

Important: The paywall must be unbypassable. We enforce this at two layers:

- Frontend: `SubscriptionGuard` redirects any non‑entitled user away from protected content.
- Backend: Firestore security rules use a `hasSubscriptionAccess(userId)` helper to deny reads/writes to projects, credentials, and files unless the user is within trial or has an active subscription. Even if a developer tampers with the frontend, the backend blocks access.

### Firestore: `users/{uid}` Schema Extensions

Server‑managed fields (updated by Cloud Functions only):

```json
{
  "trialEndsAt": "Timestamp",
  "billing": {
    "status": "none | trialing | active | past_due | canceled | incomplete | unpaid | paused",
    "planId": "string", // internal plan key (e.g., business_monthly)
    "priceId": "string", // Stripe price id
    "stripeCustomerId": "string",
    "stripeSubscriptionId": "string",
    "currentPeriodEnd": "Timestamp",
    "cancelAtPeriodEnd": false
  },
  "entitlements": ["string"] // optional, for plan features
}
```

### Firestore Rules (high level changes)

- Prevent client from modifying `billing`, `roles`, and `trialEndsAt`.
- Allow profile fields (e.g., `displayName`, `email`) as today.

Pseudocode snippet to incorporate into `firestore.rules` in `match /users/{userId}` `allow update`:

```
// Ensure client cannot change server-managed fields
request.resource.data.billing == resource.data.billing &&
request.resource.data.trialEndsAt == resource.data.trialEndsAt &&
request.resource.data.roles == resource.data.roles
```

Cloud Functions use Admin SDK and can update these fields regardless of rules.

Server‑side paywall gate in rules (conceptual):

```
function hasSubscriptionAccess(userId) {
  let userDoc = get(/databases/$(database)/documents/users/$(userId));
  let inTrial = userDoc.data.trialEndsAt != null && userDoc.data.trialEndsAt > request.time;
  let billing = userDoc.data.billing;
  let activeStatus = billing != null && (billing.status == 'active' || billing.status == 'trialing');
  let periodOk = billing == null || billing.cancelAtPeriodEnd != true || (billing.currentPeriodEnd != null && billing.currentPeriodEnd > request.time);
  return inTrial || (activeStatus && periodOk);
}

// Apply hasSubscriptionAccess(userId) on reads/writes to nested collections
// (projects, credentials, files). Avoid over‑specific field validations there; the
// subscription gate is the critical control.
```

## Stripe Configuration

### Product and Price

- Product: "ZekerKey Pro — Annual Plan".
- Price: Yearly only. Amount: 59.88 USD (equivalent to $4.99/month billed annually).
- Trial: Do NOT set a Stripe trial on the Price (app‑managed trial).

### Payment Link (Dashboard)

- Quantity fixed to 1.
- Collect customer email: Enabled (required for user matching).
- Billing address / tax / coupons: per business needs.
- After payment (success) redirect: `https://zekerkey.com/pro/billing/return?source=stripe_payment_link`.
- Note: Stripe Payment Links do not offer a separate "cancel URL". If a customer cancels, they will remain on Stripe’s hosted page.
- Metadata: Static (e.g., `app=zeker`). Payment Links cannot pass per‑user dynamic metadata.
- Output: Copy the final Payment Link URL(s) and wire to the Subscribe CTA.

Environment mapping:

- Set `STRIPE_PRICE_PRO_ANNUAL` to the Price ID used by your Payment Link so the webhook can map it to a stable `planId = pro_annual`.

### Server-side payment verification (required for unbypassable security)

To maintain an unbypassable paywall, the subscription state MUST be set only after a verified server-origin event. Relying solely on a client redirect to `/pro/billing/return` is forgeable by a skilled user and does not meet the “platinum” security bar.

Recommended options (choose one):

- Stripe Webhook (Payment Links):
  - Endpoint: `/stripe/webhook` (Firebase HTTPS Function)
  - Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Handle: `customer.subscription.created|updated|deleted`, `invoice.payment_failed`
  - Map by email; update `users/{uid}.billing` and period fields
- Stripe Checkout Sessions:
  - Use `client_reference_id = Firebase uid`, `success_url=...&session_id={CHECKOUT_SESSION_ID}`
  - Verify with `checkout.session.completed` webhook for exact user linkage

Note: Without one of the above, client navigation to the success route cannot be trusted and would weaken the rule-backed paywall.

## Frontend Changes

### Routes

- `/pro`: Plan details, 7‑day trial explanation, and Subscribe CTA (links to Payment Link).
- `/pro/billing/return`: Shows success state, triggers user doc refresh, and polls briefly until access is granted.
- `/pro/billing/canceled`: Optional informational page.

### Guards and Hooks

- `SubscriptionGuard` (new): Wrap protected content; if `!hasAccess(userDoc)`, redirect to `/pro`.
- `hasAccess(userDoc)` logic:
  - `now < trialEndsAt` OR `billing.status` in {'active','trialing'} and (if `cancelAtPeriodEnd`, still allow until `currentPeriodEnd`).
  - Route scoping: guard applied only to `/dashboard`, `/project/:projectId`, `/credentials`. The `/profile` route remains accessible; actions within can be limited by access state as needed.

### Subscribe Button

- Use the provided Stripe Payment Link URL.
- Display a note: "Use the same email as your ZekerKey login."

## Backend Changes (Firebase Functions)

### Webhook Handler

- Verify signatures using `STRIPE_WEBHOOK_SECRET`.
- Parse events and update the matching user document.
- Idempotency: use event `id` to avoid double‑processing.

### Trial Initialization (App‑Managed)

- On first login or user doc creation, set `trialEndsAt = createdAt + 7 days`.
- If Stripe‑managed trial is chosen, omit this logic and rely on webhook `trialing` status.

## Operational Notes

- Email matching: Payment Links lack dynamic metadata. Ensure payer email equals login email.
- Consider upgrading to Stripe Checkout Sessions in future to pass `client_reference_id = Firebase uid` and get a `session_id` on return.

Admin/dev bypass configuration:

- Frontend: set `VITE_PAYWALL_BYPASS_EMAILS` in `.env` to a comma-separated list (e.g., `lleep1997@gmail.com`). These emails always pass the guard.
- Backend (rules): a small allowlist inside `hasSubscriptionAccess` ensures server-side bypass for the same admins so the paywall remains unbypassable for others.

## Acceptance Criteria

- New users have a 7‑day trial and immediate access (if app‑managed) or `trialing` via Stripe.
- Post‑payment, users gain access on the `/pro/billing/return` page without manual steps.
- Firestore rules prevent client tampering of `billing` and `trialEndsAt`.
- Webhooks keep subscription state in sync for renewals, cancellations, and payment failures.

## Implementation Checklist

### 0. Pre‑work

- [x] PRICING: 59.88 USD billed yearly (4.99/month equivalent), currency USD.
- [x] Trial strategy: App‑managed (set `trialEndsAt`).
- [x] APP DOMAIN for redirects: `https://zekerkey.com`.
- [ ] Stripe Payment Link URL(s): Provide after creation.

### 1. Data Model / Rules

- [x] Extend `UserDocument` usage to include `trialEndsAt` and `billing`.
- [x] Update `firestore.rules` to protect `billing`, `roles`, and `trialEndsAt` from client updates.
- [x] Initialize `trialEndsAt` on user doc creation (app‑managed trial).

### 2. Frontend

- [x] Add `hasAccess(userDoc)` utility.
- [x] Implement `SubscriptionGuard` and apply to paywalled routes.
- [x] Create pages: `/pro`, `/pro/billing/return`, `/pro/billing/canceled`.
- [x] Wire Subscribe CTA to Payment Link URL.
- [x] On `/pro/billing/return`, refresh user doc and poll briefly.

### 3. Backend (Cloud Functions)

- [ ] Implement server-side verification (Webhook preferred):
  - [x] Create HTTPS function `/stripe/webhook` with signature verification
  - [x] Handle subscription events to update `users/{uid}` by email match
  - [x] Store `stripeCustomerId`, `stripeSubscriptionId`, `priceId`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`
  - [x] Map `priceId` → `planId` via `STRIPE_PRICE_PRO_ANNUAL`
  - [x] Configure env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_ANNUAL`
  - Rationale: required to keep paywall unbypassable

### 4. QA

- [ ] New user gets trial; access is granted.
- [ ] Payment Link flow completes; return page transitions to access within seconds.
- [ ] Cancel subscription; access persists until `currentPeriodEnd`, then revokes.
- [ ] Simulate payment failure; status becomes `past_due` and access rules behave as designed.

## Stripe Product Form — Exact Settings

Use these values in the Stripe Dashboard "Add a product" form:

- Name: ZekerKey Pro — Annual Plan
- Description: Secure, client‑side encrypted storage for API keys and credentials. Organize by projects and access anywhere. 7‑day free trial. Billed annually at $59.88 ($4.99/month).
- Image: Upload a square logo under 2MB (PNG/JPG/WebP). Recommended: your app logo.
- Product tax code: Choose an appropriate SaaS/digital services code (or keep default if not using Stripe Tax).
- More options: leave defaults unless you need tax behavior overrides.

Pricing section:

- Recurring (selected)
- Amount: 59.88
- Currency: USD
- Include tax in price: No (set Yes only if operating tax‑inclusive pricing)
- Billing period: Yearly

After you click Add product:

- Create a Payment Link for this Price.
- Configure the Payment Link:
  - Quantity: Fixed at 1
  - Collect email: Enabled
  - Success redirect URL: https://zekerkey.com/pro/billing/return?source=stripe_payment_link
  - (No cancel URL option exists for Payment Links.)
  - Copy the Payment Link URL and paste it back into this doc and wire it to the Subscribe CTA.

## Inputs To Be Provided

- Stripe Payment Link URL(s): https://buy.stripe.com/9B68wO1Lx0jz4sAfTWbbG03

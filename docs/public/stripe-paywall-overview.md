# ZekerKey Pro — Access & Billing

Some features and documents require a Pro subscription. This guide explains trials, Pro rules, and what to expect after payment.

## Trial access

- Every account starts with a 7‑day free trial.
- During the trial, you have Pro‑level access.
- No card is required to start the trial.

## Pro subscription

- Price: $4.99/month billed annually ($59.88 per year).
- Payments are processed by Stripe.
- Use the same email as your ZekerKey login at checkout to link your account.

## Access rules (high level)

- Trial: access is granted until the trial end time.
- Pro Active / Trialing: full access.
- Cancel at period end: access continues until `currentPeriodEnd`.
- Lapsed or past due: access may be limited until resolved.

## After payment

- You’re redirected back to ZekerKey.
- Your account upgrades automatically within seconds.
- If it takes longer, refresh the page — we sync status via webhooks.

## Cancelling

- You can cancel anytime from your Stripe customer portal (coming soon) or via support.
- Access remains until the end of your billing period.

## FAQs

- Can I switch emails later?
  - For instant linking, use the same email at checkout as your ZekerKey login.
- Do I get a refund if I cancel mid‑term?
  - We do not offer prorated refunds on annual billing cycles.
- How do I get invoices/receipts?
  - Stripe will email receipts to your billing email.

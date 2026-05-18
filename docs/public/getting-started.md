# Getting Started with ZekerKey

Welcome to ZekerKey — a secure, developer‑first credential manager. This guide helps you get set up quickly and explains the core workflows you’ll use daily.

## What is ZekerKey?

ZekerKey helps you and your team organize API keys and secrets by project. Your secrets are encrypted in your browser before they are stored.

## Account Setup (2–3 minutes)

1. Create an account and sign in.
2. Set your master password when prompted.
   - This never leaves your device and is required to decrypt your data.
3. You’re ready to create projects and add credentials.

## Master Password Basics

- Used to derive an encryption key locally in your browser.
- Never transmitted or stored by ZekerKey servers.
- If you forget it, we cannot recover your data.
- Choose a strong, unique passphrase (12+ characters with variety).

## Projects and Credentials

- Projects help you group secrets by application, environment, or team (e.g., "Acme API — Staging").
- Each credential can include:
  - Name (e.g., "Stripe Secret Key")
  - Optional username/ID
  - Secret value
  - Optional notes for context

### Create your first project

1. Go to Dashboard → New Project.
2. Name the project (e.g., "My App — Prod").
3. Save.

### Add a credential

1. Open your project → Add Credential.
2. Fill in fields and paste your secret.
3. Save — the value is encrypted locally before upload.

## Daily Workflow Tips

- Use separate projects per environment (Prod, Staging, Dev).
- Add notes to record rotation dates, owner, or integration specifics.
- When done, lock your session (or close the tab) to clear the in‑memory key.

## Security Quick Facts

- Client‑side encryption: AES‑GCM in the browser.
- Key derivation: from your master password (kept in memory only while unlocked).
- Your master password is never sent to the server.

## Keyboard Shortcuts (coming soon)

- Global command palette to jump to projects and actions faster.
- Search across projects and credentials.

## Troubleshooting

- "I can’t see secrets": Unlock your session by entering your master password.
- "I forgot my master password": We cannot recover it — rotate secrets and recreate them under a new master password.
- "I subscribed but don’t see access": Wait a few seconds or refresh; ensure your Stripe email matches your login email.

## FAQ

- Do I need a card for the trial?
  - No. Trials begin automatically.
- Can I cancel anytime?
  - Yes. You retain access until the end of the billing period.
- Is export/import supported?
  - Planned — we’ll provide secure export and guided import.

## What’s next

- Read the Security Overview for a deeper dive into how encryption works.
- See Pro Access & Billing to understand trial and subscription details.

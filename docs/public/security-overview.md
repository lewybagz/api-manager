# Security Overview

We designed ZekerKey to keep your secrets safe while staying fast and easy to use.

## Threat model

- Prevent plaintext reads of secrets by the server or attackers.
- Limit blast radius if an account is compromised without the master password.
- Protect secrets at rest and in transit.

## Encryption pipeline (client‑side)

1. You unlock the session by entering your master password.
2. A key is derived locally using PBKDF2.
3. When you save a secret, it’s encrypted in your browser using AES‑GCM.
4. Only ciphertext and metadata (e.g., IV) are sent to the server.
5. To read a secret, your browser decrypts it with the in‑memory key.

### Algorithms & parameters

- Cipher: AES‑GCM (authenticated encryption)
- Key derivation: PBKDF2 (salted, high iteration count)
- Per‑item IV: unique per secret

## Access control

- Trials and Pro users can access all product features.
- Some documentation and features are Pro‑only.
- Admin/dev bypass can be configured for specific emails.

## Password & session guidance

- Choose a strong passphrase (12+ chars with upper/lower/number/symbols).
- Avoid reusing passwords from other services.
- Lock your session when stepping away; the key is removed from memory.
- Rotate secrets periodically and revoke old credentials.

## Data handling & storage

- Your master password never leaves your device.
- Ciphertexts and metadata are stored in Firestore.
- Firestore security rules restrict access to your data.
- Stripe billing metadata is stored to determine subscription status.

## Known limitations

- If you forget your master password, we cannot decrypt your data.
- Team access and sharing features (with cryptographic envelopes) are planned.

## FAQ

- Do you store my master password?
  - No.
- Can support decrypt my data?
  - No — decryption keys are derived locally and not shared with the server.
- What happens if my session is locked?
  - You’ll be prompted for your master password to decrypt again.

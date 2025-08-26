# Security Overview

We designed ZekerKey to keep your secrets safe while staying fast and easy to use.

## Threat model

- Protect secrets at rest and in transit.
- Mitigate the risk of account compromise by requiring knowledge of a master password.
- Prevent server-side reads of plaintext secrets.

## Encryption model

- Algorithm: AES‑GCM performed in the browser.
- Key derivation: derived from your master password using PBKDF2; the key is kept in memory only.
- IVs: unique IV per secret; stored alongside ciphertext.

## Access control

- Trial or Pro users can access all features.
- Some documentation and features are gated to Pro.
- Admin/dev bypass is supported via configured emails.

## Best practices

- Choose a strong master password and keep it private.
- Lock your session when stepping away.
- Rotate secrets regularly and remove unused credentials.

## Data handling

- We never store or transmit your master password.
- Ciphertexts and metadata live in your account in Firestore; security rules enforce access.

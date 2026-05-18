import CryptoJS from "crypto-js";

/** Must stay aligned with Firestore ciphertexts: existing users rely on this exact KDF. */
export const MASTER_PBKDF2_ITERATIONS = 310_000;

/** Word size for CryptoJS PBKDF2 `keySize` (32-bit words) → 256-bit AES key. */
export const MASTER_PBKDF2_KEY_SIZE_WORDS = 256 / 32;

/**
 * Derives the AES-256 key material (hex) from the master password and Firebase uid salt.
 * Same parameters as the historical in-browser implementation.
 */
export function deriveMasterKeyHex(password: string, uidSalt: string): string {
  const derivedKey = CryptoJS.PBKDF2(password, uidSalt, {
    hasher: CryptoJS.algo.SHA256,
    iterations: MASTER_PBKDF2_ITERATIONS,
    keySize: MASTER_PBKDF2_KEY_SIZE_WORDS,
  });
  return derivedKey.toString(CryptoJS.enc.Hex);
}

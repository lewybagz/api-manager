/**
 * Service for handling client-side encryption and decryption using the Web Crypto API.
 */

/**
 * Decrypts a blob using AES-GCM.
 * @param keyHex The encryption key in hex format.
 * @param encryptedBlob The blob to decrypt.
 * @param ivBase64 The initialization vector as a base64 string.
 * @returns A promise that resolves to the decrypted blob.
 */
export async function decryptWithKey(
  keyHex: string,
  encryptedBlob: Blob,
  ivBase64: string
): Promise<Blob> {
  const key = await importKey(keyHex);
  const iv = base64ToArrayBuffer(ivBase64);
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      iv: new Uint8Array(iv),
      name: "AES-GCM",
    },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer]);
}

/**
 * Encrypts a file using AES-GCM.
 * @param keyHex The encryption key in hex format.
 * @param file The file to encrypt.
 * @returns A promise that resolves to an object containing the encrypted blob and the IV as a base64 string.
 */
export async function encryptWithKey(
  keyHex: string,
  file: File
): Promise<{ encryptedBlob: Blob; iv: string }> {
  const key = await importKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM is recommended.
  const fileBuffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      iv: iv,
      name: "AES-GCM",
    },
    key,
    fileBuffer
  );

  const encryptedBlob = new Blob([encryptedBuffer]);
  const ivBase64 = window.btoa(String.fromCharCode(...new Uint8Array(iv)));

  return { encryptedBlob, iv: ivBase64 };
}

// Converts a Base64 string to an ArrayBuffer.
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Imports a hex-encoded key for use with the Web Crypto API.
async function importKey(keyHex: string): Promise<CryptoKey> {
  const matches = keyHex.match(/.{1,2}/g) ?? [];
  const keyBytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
} 
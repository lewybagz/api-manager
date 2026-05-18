import CryptoJS from "crypto-js";
import { describe, expect, it } from "vitest";

import {
  decryptWithKey,
  encryptWithKey,
} from "../services/encryptionService";
import {
  deriveMasterKeyHex,
  MASTER_PBKDF2_ITERATIONS,
  MASTER_PBKDF2_KEY_SIZE_WORDS,
} from "./masterKeyDerivation";

/** Mirrors legacy CBC decrypt in credentialStore (must stay behavior-identical). */
function legacyDecryptCbcUtf8(
  cipherBase64: string,
  keyHex: string,
  ivHex: string
): null | string {
  try {
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const decrypted = CryptoJS.AES.decrypt(cipherBase64, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    return text || null;
  } catch {
    return null;
  }
}

describe("master key derivation (golden)", () => {
  const goldenUidSalt = "firebaseUidGoldenTest1";
  const goldenPassword = "GoldenPlanPassword!1";
  const goldenKeyHex =
    "31feb0246b3bf723fc487723c9006f9ca1a94d04326f74e7c15c9daba220fada";

  it("matches committed PBKDF2-SHA256 vector (310k iter, uid salt string)", () => {
    expect(MASTER_PBKDF2_ITERATIONS).toBe(310_000);
    expect(MASTER_PBKDF2_KEY_SIZE_WORDS).toBe(8);
    expect(deriveMasterKeyHex(goldenPassword, goldenUidSalt)).toBe(goldenKeyHex);
  });
});

describe("AES-256-GCM (golden + round-trip)", () => {
  const keyHex =
    "31feb0246b3bf723fc487723c9006f9ca1a94d04326f74e7c15c9daba220fada";
  const goldenIvB64 = "AAECAwQFBgcICQoL";
  const goldenCipherB64 = "dSuFyLMKkOU87dj2+sCVodVYfBw6vI2Oom/XB52ODAtGCA==";

  it("decrypts committed Web Crypto AES-GCM vector", async () => {
    const binary = atob(goldenCipherB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes]);
    const out = await decryptWithKey(keyHex, blob, goldenIvB64);
    expect(await out.text()).toBe("hello golden world");
  });

  it("round-trips plaintext via encryptWithKey / decryptWithKey", async () => {
    const plain = "round-trip check äöü";
    const { encryptedBlob, iv } = await encryptWithKey(
      keyHex,
      new Blob([new TextEncoder().encode(plain)], { type: "text/plain" })
    );
    const round = await decryptWithKey(keyHex, encryptedBlob, iv);
    expect(await round.text()).toBe(plain);
  });
});

describe("legacy AES-CBC (golden)", () => {
  const keyHex =
    "31feb0246b3bf723fc487723c9006f9ca1a94d04326f74e7c15c9daba220fada";
  const ivHex = "00112233445566778899aabbccddeeff";
  const cipherB64 = "f+Dy4FNxVG7tnwtuXHRDYwrd7C5mZdVEavR0N4gSdDw=";

  it("decrypts committed CryptoJS CBC vector", () => {
    expect(legacyDecryptCbcUtf8(cipherB64, keyHex, ivHex)).toBe("legacy cbc golden");
  });
});

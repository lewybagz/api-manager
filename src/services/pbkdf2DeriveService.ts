import { deriveMasterKeyHex } from "../crypto/masterKeyDerivation";

import type {
  Pbkdf2WorkerInbound,
  Pbkdf2WorkerOutbound,
} from "../workers/pbkdf2.worker";

/**
 * Runs PBKDF2 off the main thread when workers are available; falls back to the
 * same derivation on the main thread so unlock always matches historical behavior.
 */
export function deriveMasterKeyHexWithWorkerFallback(
  password: string,
  uidSalt: string
): Promise<string> {
  if (typeof Worker === "undefined") {
    return Promise.resolve(deriveMasterKeyHex(password, uidSalt));
  }

  try {
    const workerUrl = new URL("../workers/pbkdf2.worker.ts", import.meta.url);
    const worker = new Worker(workerUrl, { type: "module" });

    return new Promise<string>((resolve, reject) => {
      const finish = () => {
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
      };

      worker.onmessage = (ev: MessageEvent<Pbkdf2WorkerOutbound>) => {
        finish();
        const data = ev.data;
        if (data?.keyHex) {
          resolve(data.keyHex);
          return;
        }
        try {
          resolve(deriveMasterKeyHex(password, uidSalt));
        } catch (e) {
          reject(e instanceof Error ? e : new Error("PBKDF2 fallback failed."));
        }
      };

      worker.onerror = () => {
        finish();
        try {
          resolve(deriveMasterKeyHex(password, uidSalt));
        } catch (e) {
          reject(e instanceof Error ? e : new Error("PBKDF2 fallback failed."));
        }
      };

      const payload: Pbkdf2WorkerInbound = { password, uidSalt };
      worker.postMessage(payload);
    });
  } catch {
    return Promise.resolve(deriveMasterKeyHex(password, uidSalt));
  }
}

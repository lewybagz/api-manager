/// <reference lib="webworker" />

import { deriveMasterKeyHex } from "../crypto/masterKeyDerivation";

export type Pbkdf2WorkerInbound = {
  password: string;
  uidSalt: string;
};

export type Pbkdf2WorkerOutbound =
  | { error: string; keyHex?: undefined }
  | { error?: undefined; keyHex: string };

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<Pbkdf2WorkerInbound>) => {
  const { password, uidSalt } = event.data ?? {};
  if (typeof password !== "string" || typeof uidSalt !== "string") {
    const msg: Pbkdf2WorkerOutbound = {
      error: "Invalid worker message: expected password and uidSalt strings.",
    };
    self.postMessage(msg);
    return;
  }
  try {
    const keyHex = deriveMasterKeyHex(password, uidSalt);
    const msg: Pbkdf2WorkerOutbound = { keyHex };
    self.postMessage(msg);
  } catch (e) {
    const msg: Pbkdf2WorkerOutbound = {
      error: e instanceof Error ? e.message : "PBKDF2 derivation failed.",
    };
    self.postMessage(msg);
  }
};

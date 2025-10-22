export function hasWebCrypto(): boolean {
  try {
    return typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";
  } catch {
    return false;
  }
}

export function getRandomValuesSafe(target: Uint8Array): Uint8Array {
  if (hasWebCrypto()) {
    return crypto.getRandomValues(target);
  }
  // Fallback: use Math.random (biased, but avoids crashes in restricted envs)
  for (let i = 0; i < target.length; i++) {
    // 0-255
    target[i] = Math.floor(Math.random() * 256);
  }
  return target;
}

export function getSecureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0 || !Number.isFinite(maxExclusive)) return 0;
  if (hasWebCrypto()) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let x = 0;
    do {
      getRandomValuesSafe(arr as unknown as Uint8Array as Uint8Array);
      x = (arr as unknown as Uint32Array)[0];
    } while (x >= limit);
    return x % maxExclusive;
  }
  // Fallback: Math.random
  return Math.floor(Math.random() * maxExclusive);
}



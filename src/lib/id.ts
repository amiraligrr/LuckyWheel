let counter = 0;

export function createId(prefix = "id"): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return `${prefix}_${cryptoObject.randomUUID()}`;
  }
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Uniform random number in [0, 1). Uses the platform CSPRNG when available. */
export function randomUnit(): number {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    cryptoObject.getRandomValues(buffer);
    return buffer[0] / 0x1_0000_0000;
  }
  return Math.random();
}

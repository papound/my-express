const PBKDF2_PREFIX = "pbkdf2:sha256:";
const DEFAULT_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    const byteA = i < a.length ? a[i] : 0;
    const byteB = i < b.length ? b[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return new Uint8Array(derivedBits);
}

export async function hashPassword(
  password: string,
  iterations = DEFAULT_ITERATIONS
): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePbkdf2(password, salt, iterations);
  return `${PBKDF2_PREFIX}${iterations}:${toHex(salt)}:${toHex(derived)}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  if (!password || !stored) return false;

  if (stored.startsWith(PBKDF2_PREFIX)) {
    const rest = stored.slice(PBKDF2_PREFIX.length);
    const parts = rest.split(":");
    if (parts.length !== 3) return false;

    const iterations = Number.parseInt(parts[0], 10);
    if (!Number.isFinite(iterations) || iterations < 10_000) return false;

    const salt = fromHex(parts[1]);
    const expected = fromHex(parts[2]);
    if (!salt || !expected || expected.length !== KEY_LENGTH_BITS / 8) {
      return false;
    }

    const actual = await derivePbkdf2(password, salt, iterations);
    return timingSafeEqualBytes(actual, expected);
  }

  // Legacy plaintext fallback (constant-time comparison)
  const encoder = new TextEncoder();
  return timingSafeEqualBytes(
    encoder.encode(password),
    encoder.encode(stored)
  );
}

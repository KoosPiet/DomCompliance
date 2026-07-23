import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { env } from "@/env";

/**
 * Application-layer encryption for sensitive PII (SA ID numbers, passport
 * numbers, bank account numbers). Uses AES-256-GCM which provides both
 * confidentiality and integrity (auth tag).
 *
 * Stored format (base64): [12-byte IV][16-byte auth tag][ciphertext]
 * A short version prefix ("v1:") allows the algorithm to evolve without
 * ambiguity when reading historical rows.
 */

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/** Derive a 32-byte key from ENCRYPTION_KEY (accepts base64, hex or raw). */
function resolveKey(): Buffer {
  const raw = env.ENCRYPTION_KEY;

  for (const encoding of ["base64", "hex"] as const) {
    try {
      const buf = Buffer.from(raw, encoding);
      if (buf.length === KEY_LENGTH) return buf;
    } catch {
      // try next encoding
    }
  }

  // Fallback: derive a deterministic 32-byte key via SHA-256 of the secret.
  return createHash("sha256").update(raw).digest();
}

const KEY = resolveKey();

/** Encrypt a plaintext string. Returns null for null/empty input. */
export function encryptPii(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${VERSION}:${payload}`;
}

/** Decrypt a value produced by {@link encryptPii}. Returns null for null. */
export function decryptPii(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;

  const [version, payload] = value.split(":", 2);
  if (version !== VERSION || !payload) {
    throw new Error("Unsupported or malformed ciphertext");
  }

  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Deterministic, non-reversible hash for blind-indexing/searching an
 * encrypted field (e.g. to enforce uniqueness of an ID number without
 * storing it in the clear). Keyed with the encryption secret.
 */
export function blindIndex(value: string): string {
  return createHash("sha256")
    .update(`${env.ENCRYPTION_KEY}:${value.trim().toLowerCase()}`)
    .digest("hex");
}

/** Constant-time comparison for secrets/tokens. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Mask a value for display, e.g. "•••• •••• •••• 1234". */
export function maskTail(value: string | null | undefined, visible = 4): string {
  if (!value) return "";
  const tail = value.slice(-visible);
  return `•••• ${tail}`;
}

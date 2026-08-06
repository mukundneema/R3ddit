import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export const REDDIT_TOKEN_COOKIE = "geodo_reddit_session";
export const REDDIT_STATE_COOKIE = "geodo_reddit_oauth_state";

export interface RedditTokenPayload {
  accessToken: string;
  username: string;
  expiresAt: number; // epoch ms
}

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Add a long random string to your .env.local file (see .env.example)."
    );
  }
  // Derive a stable 32-byte key from the provided secret.
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a JSON-serializable payload into a single base64url string
 * suitable for storing in an httpOnly cookie. No server-side storage
 * or database is used — the cookie itself is the only state.
 */
export function encryptPayload(payload: unknown): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64url");
}

/**
 * Decrypts a value produced by encryptPayload. Returns null if the value
 * is missing, malformed, or fails authentication (e.g. tampered with).
 */
export function decryptPayload<T>(value: string | undefined | null): T | null {
  if (!value) return null;

  try {
    const key = getKey();
    const combined = Buffer.from(value, "base64url");

    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

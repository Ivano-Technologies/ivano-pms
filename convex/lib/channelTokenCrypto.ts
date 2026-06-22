"use node";

import crypto from "crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

/**
 * Validates CHANNEL_TOKEN_ENCRYPTION_KEY is present and AES-256-sized.
 * Call at the start of internal actions so misconfiguration fails before any write.
 */
export function validateChannelTokenEncryptionKey(): void {
  getEncryptionKey();
}

function getEncryptionKey(): Buffer {
  const raw = process.env.CHANNEL_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "CHANNEL_TOKEN_ENCRYPTION_KEY is not configured (set in Convex dashboard; generate with: openssl rand -base64 32)"
    );
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error(
      "CHANNEL_TOKEN_ENCRYPTION_KEY must be valid base64 (generate with: openssl rand -base64 32)"
    );
  }

  if (key.length !== 32) {
    throw new Error(
      `CHANNEL_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). Generate with: openssl rand -base64 32`
    );
  }

  return key;
}

/** Encrypts a channel token for storage. Prefix `v1:` marks ciphertext format. */
export function encryptChannelToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}

/** Decrypts a stored channel token. Legacy plaintext (no `v1:` prefix) is returned as-is. */
export function decryptChannelToken(stored: string): string {
  if (!stored.startsWith(`${VERSION}:`)) {
    return stored;
  }

  const parts = stored.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted channel token format");
  }

  const [, ivB64, tagB64, dataB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64!, "base64url");
  const tag = Buffer.from(tagB64!, "base64url");
  const data = Buffer.from(dataB64!, "base64url");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}

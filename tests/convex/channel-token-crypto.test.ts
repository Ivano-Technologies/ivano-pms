import { beforeAll, describe, expect, it } from "vitest";

import { decryptChannelToken, encryptChannelToken } from "../../convex/lib/channelTokenCrypto";

beforeAll(() => {
  process.env.CHANNEL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
    "base64"
  );
});

describe("channelTokenCrypto", () => {
  it("round-trips plaintext through encrypt/decrypt", () => {
    const plaintext = "EAAtest-whatsapp-token-12345";
    const encrypted = encryptChannelToken(plaintext);

    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptChannelToken(encrypted)).toBe(plaintext);
  });

  it("returns legacy plaintext when no v1 prefix", () => {
    expect(decryptChannelToken("legacy-plaintext-token")).toBe(
      "legacy-plaintext-token"
    );
  });

  it("throws when encryption key is missing", () => {
    delete process.env.CHANNEL_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptChannelToken("token")).toThrow(
      /CHANNEL_TOKEN_ENCRYPTION_KEY is not configured/
    );
    process.env.CHANNEL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64"
    );
  });

  it("throws when key decodes to wrong length", () => {
    process.env.CHANNEL_TOKEN_ENCRYPTION_KEY = Buffer.from("tooshort").toString(
      "base64"
    );
    expect(() => encryptChannelToken("token")).toThrow(/must decode to 32 bytes/);
    process.env.CHANNEL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64"
    );
  });

  it("throws on truncated v1 ciphertext instead of treating as legacy", () => {
    expect(() => decryptChannelToken("v1:abc")).toThrow(
      /Invalid encrypted channel token format/
    );
    expect(() => decryptChannelToken("v1:")).toThrow(
      /Invalid encrypted channel token format/
    );
  });

  it("throws on empty v1 segments", () => {
    expect(() => decryptChannelToken("v1:::")).toThrow(
      /Invalid encrypted channel token format/
    );
  });

  it("throws on tampered v1 ciphertext instead of returning garbage", () => {
    const encrypted = encryptChannelToken("EAAtest-token");
    const parts = encrypted.split(":");
    const data = parts[3]!;
    parts[3] = `${data.slice(0, -1)}X`;
    const tampered = parts.join(":");

    expect(() => decryptChannelToken(tampered)).toThrow(
      /Failed to decrypt channel token/
    );
  });
});

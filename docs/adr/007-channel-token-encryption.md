# ADR-007: Channel Token Encryption at Rest

## Status
ACCEPTED | June 2026

## Decision

Store OAuth access and refresh tokens in the `channelToken` table as **AES-256-GCM ciphertext** with a `v1:` format prefix. Plaintext tokens are never written by production code paths.

- **Write path:** `internal.functions.channelTokenActions.upsertChannelToken` (encrypts, then calls internal mutation)
- **Read path (decrypt):** `internal.functions.channelTokenActions.getDecryptedChannelToken` — internal actions only; never exposed via public queries
- **Public UI:** `getChannelTokens` returns connection metadata only (no token values)

## Key management

- Env var: `CHANNEL_TOKEN_ENCRYPTION_KEY` (base64, must decode to 32 bytes)
- Set in **Convex dashboard only** (not client-side)
- Generate: `openssl rand -base64 32`
- Validation: `validateChannelTokenEncryptionKey()` runs at the start of every encrypt/decrypt action — missing or wrong-length keys throw immediately

## `v1:` prefix

The `v1:` prefix identifies **ciphertext format** (algorithm + encoding), not a specific key version. Key rotation is not automated: rotating the env var requires re-saving each token through `upsertChannelToken` so it is re-encrypted. Legacy plaintext rows (no `v1:` prefix) are returned as-is on decrypt until re-saved.

## Related

- [`convex/lib/channelTokenCrypto.ts`](../../convex/lib/channelTokenCrypto.ts)
- [`convex/functions/channelTokenActions.ts`](../../convex/functions/channelTokenActions.ts)
- [`docs/planning/WEEK-6-KICKOFF.md`](../planning/WEEK-6-KICKOFF.md)

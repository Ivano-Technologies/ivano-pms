/**
 * Generate Convex Auth JWT_PRIVATE_KEY + JWKS for the Convex dashboard.
 * Usage: node scripts/generate-auth-keys.mjs
 * Paste both lines into Convex → Settings → Environment Variables.
 * Do not commit the output.
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

process.stdout.write(
  `JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"\n`
);
process.stdout.write(`JWKS=${jwks}\n`);

/** IVA-189: the support ref generator, with no client only imports so API routes can use it too. */
export const ERROR_REF_LENGTH = 8;
export const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A fresh 8 character support ref, such as "K7QM2XWA". */
export function generateErrorRef(): string {
  const bytes = new Uint8Array(ERROR_REF_LENGTH);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return out;
}

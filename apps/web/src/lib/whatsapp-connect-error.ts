import { generateErrorRef } from "@/lib/error-ref-code";

/**
 * IVA-189: the WhatsApp connect messages on Settings. Coco's wording; edit the copy here only.
 * Never show Meta, OAuth, env var or token details to the user. The raw detail is logged with the
 * ref (server side in the OAuth callback, client side with the error code).
 */
export const WHATSAPP_CONNECT_COPY = {
  notConfigured: {
    message: "WhatsApp isn't set up yet. Ask an admin to set it up.",
    actionLabel: null
  },
  connectFailed: {
    message: "We couldn't connect WhatsApp. Try again.",
    actionLabel: "Try again"
  },
  expired: {
    message: "Your WhatsApp connection has expired. Reconnect to keep sending messages.",
    actionLabel: "Reconnect"
  },
  other: {
    message: "Something went wrong connecting WhatsApp. Try again.",
    actionLabel: "Try again"
  }
} as const;

export type WhatsAppConnectErrorKind = keyof typeof WHATSAPP_CONNECT_COPY;

/**
 * Which case each `oauth_error` code from /api/oauth/whatsapp falls into.
 * - notConfigured: WHATSAPP_APP_ID or WHATSAPP_APP_SECRET is missing on the server.
 * - connectFailed: the person cancelled at Meta, or the authorization code or state was bad.
 * - expired: the access token has expired or is no longer valid.
 * - other: anything else, including store_failed (saving the connection failed) and codes we
 *   don't know yet.
 */
const KIND_BY_CODE: Record<string, WhatsAppConnectErrorKind> = {
  whatsapp_not_configured: "notConfigured",
  access_denied: "connectFailed",
  missing_code: "connectFailed",
  invalid_state: "connectFailed",
  token_exchange_failed: "connectFailed",
  token_expired: "expired",
  token_invalid: "expired"
};

export function whatsAppConnectErrorKind(code: string | null | undefined): WhatsAppConnectErrorKind {
  if (!code) return "other";
  return Object.prototype.hasOwnProperty.call(KIND_BY_CODE, code) ? KIND_BY_CODE[code] : "other";
}

const REF_PATTERN = /^[A-Z0-9]{8}$/;

/** The ref the OAuth callback logged, when it passed a valid one, else a fresh one. */
export function whatsAppConnectRef(serverRef: string | null | undefined): string {
  const ref = serverRef?.trim().toUpperCase();
  return ref && REF_PATTERN.test(ref) ? ref : generateErrorRef();
}

export type WhatsAppConnectError = {
  kind: WhatsAppConnectErrorKind;
  message: string;
  actionLabel: string | null;
  ref: string;
};

export function toWhatsAppConnectError(
  code: string | null | undefined,
  serverRef?: string | null
): WhatsAppConnectError {
  const kind = whatsAppConnectErrorKind(code);
  const copy = WHATSAPP_CONNECT_COPY[kind];
  return { kind, message: copy.message, actionLabel: copy.actionLabel, ref: whatsAppConnectRef(serverRef) };
}

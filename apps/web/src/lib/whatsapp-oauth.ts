import { createHmac, timingSafeEqual } from "node:crypto";

import { getAppOrigin } from "@/lib/app-origin";

export const WHATSAPP_OAUTH_STATE_COOKIE = "ivano_wa_oauth";
export const WHATSAPP_GRAPH_API_VERSION = "v21.0";
export const WHATSAPP_OAUTH_SCOPES = [
  "whatsapp_business_management",
  "whatsapp_business_messaging",
  "business_management"
].join(",");

export type WhatsAppOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  stateSecret: string;
};

export type WhatsAppOAuthState = {
  propertyId: string;
  nonce: string;
  exp: number;
};

export type WhatsAppTokenResult = {
  accessToken: string;
  expiresAt?: number;
  phoneNumberId?: string;
};

function cleanEnv(value: string | undefined): string | undefined {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
}

export function getWhatsAppOAuthConfig(): WhatsAppOAuthConfig | null {
  const appId = cleanEnv(process.env.WHATSAPP_APP_ID);
  const appSecret = cleanEnv(process.env.WHATSAPP_APP_SECRET);
  const stateSecret =
    cleanEnv(process.env.INTERNAL_JOB_SECRET) ?? appSecret;
  if (!appId || !appSecret || !stateSecret) {
    return null;
  }

  const redirectUri =
    cleanEnv(process.env.WHATSAPP_OAUTH_REDIRECT_URI) ??
    `${getAppOrigin()}/api/oauth/whatsapp/callback`;

  return { appId, appSecret, redirectUri, stateSecret };
}

export function createOAuthNonce(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function signWhatsAppOAuthState(
  payload: WhatsAppOAuthState,
  secret: string
): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyWhatsAppOAuthState(
  state: string,
  secret: string,
  now = Date.now()
): WhatsAppOAuthState {
  const [body, signature] = state.split(".");
  if (!body || !signature) {
    throw new Error("invalid_state");
  }

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    throw new Error("invalid_state");
  }

  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as unknown;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as WhatsAppOAuthState).propertyId !== "string" ||
    typeof (parsed as WhatsAppOAuthState).nonce !== "string" ||
    typeof (parsed as WhatsAppOAuthState).exp !== "number"
  ) {
    throw new Error("invalid_state");
  }

  const payload = parsed as WhatsAppOAuthState;
  if (!payload.propertyId.trim() || payload.exp <= now) {
    throw new Error("invalid_state");
  }
  return payload;
}

export function buildWhatsAppAuthorizeUrl(
  config: WhatsAppOAuthConfig,
  state: string
): string {
  const url = new URL(`https://www.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", WHATSAPP_OAUTH_SCOPES);
  return url.toString();
}

type GraphTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string };
};

type GraphPhoneResponse = {
  data?: Array<{ id?: string }>;
};

function graphUrl(path: string): string {
  return `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}${path}`;
}

export async function exchangeWhatsAppCode(
  code: string,
  config: WhatsAppOAuthConfig,
  fetchImpl: typeof fetch = fetch
): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("code", code);

  const response = await fetchImpl(url.toString());
  const payload = (await response.json()) as GraphTokenResponse;
  if (!payload.access_token) {
    throw new Error(payload.error?.message ?? "token_exchange_failed");
  }
  return { accessToken: payload.access_token, expiresIn: payload.expires_in };
}

export async function exchangeWhatsAppLongLivedToken(
  shortLivedToken: string,
  config: WhatsAppOAuthConfig,
  fetchImpl: typeof fetch = fetch
): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const response = await fetchImpl(url.toString());
  const payload = (await response.json()) as GraphTokenResponse;
  if (!payload.access_token) {
    return { accessToken: shortLivedToken };
  }
  return { accessToken: payload.access_token, expiresIn: payload.expires_in };
}

export async function resolveWhatsAppPhoneNumberId(
  accessToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | undefined> {
  const fromEnv = cleanEnv(process.env.WHATSAPP_PHONE_NUMBER_ID);
  if (fromEnv) {
    return fromEnv;
  }

  const owned = await fetchImpl(
    `${graphUrl("/me")}?fields=id&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!owned.ok) {
    return undefined;
  }

  const businesses = await fetchImpl(
    `${graphUrl("/me/businesses")}?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!businesses.ok) {
    return undefined;
  }

  const businessPayload = (await businesses.json()) as { data?: Array<{ id?: string }> };
  const businessId = businessPayload.data?.find((row) => row.id)?.id;
  if (!businessId) {
    return undefined;
  }

  const wabas = await fetchImpl(
    `${graphUrl(`/${businessId}/owned_whatsapp_business_accounts`)}?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!wabas.ok) {
    return undefined;
  }
  const wabaPayload = (await wabas.json()) as { data?: Array<{ id?: string }> };
  const wabaId = wabaPayload.data?.find((row) => row.id)?.id;
  if (!wabaId) {
    return undefined;
  }

  const phones = await fetchImpl(
    `${graphUrl(`/${wabaId}/phone_numbers`)}?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!phones.ok) {
    return undefined;
  }
  const phonePayload = (await phones.json()) as GraphPhoneResponse;
  return phonePayload.data?.find((row) => row.id)?.id;
}

export async function completeWhatsAppOAuth(
  code: string,
  config: WhatsAppOAuthConfig,
  fetchImpl: typeof fetch = fetch
): Promise<WhatsAppTokenResult> {
  const shortLived = await exchangeWhatsAppCode(code, config, fetchImpl);
  const longLived = await exchangeWhatsAppLongLivedToken(
    shortLived.accessToken,
    config,
    fetchImpl
  );
  const phoneNumberId = await resolveWhatsAppPhoneNumberId(
    longLived.accessToken,
    fetchImpl
  );
  const expiresIn = longLived.expiresIn ?? shortLived.expiresIn;

  return {
    accessToken: longLived.accessToken,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    phoneNumberId
  };
}

export function settingsOAuthRedirect(error?: string): string {
  const origin = getAppOrigin();
  if (error) {
    return `${origin}/dashboard/settings?oauth_error=${encodeURIComponent(error)}`;
  }
  return `${origin}/dashboard/settings?connected=whatsapp`;
}

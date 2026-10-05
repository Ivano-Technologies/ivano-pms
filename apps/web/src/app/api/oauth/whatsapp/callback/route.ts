import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

import type { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  WHATSAPP_OAUTH_STATE_COOKIE,
  completeWhatsAppOAuth,
  getWhatsAppOAuthConfig,
  settingsOAuthRedirect,
  verifyWhatsAppOAuthState
} from "@/lib/whatsapp-oauth";

const STORE_WHATSAPP_OAUTH_TOKEN =
  "functions/whatsappActions:storeWhatsAppOAuthToken" as unknown as FunctionReference<
    "action",
    "public"
  >;

function cleanEnv(value: string | undefined): string | undefined {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
}

function getConvexClient(): ConvexHttpClient {
  const url =
    cleanEnv(process.env.NEXT_PUBLIC_CONVEX_URL) ?? cleanEnv(process.env.CONVEX_URL);
  if (!url) {
    throw new Error("CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

function getInternalJobSecret(): string {
  const secret = cleanEnv(process.env.INTERNAL_JOB_SECRET);
  if (!secret) {
    throw new Error("INTERNAL_JOB_SECRET is not configured");
  }
  return secret;
}

function clearOAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(WHATSAPP_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/oauth/whatsapp",
    maxAge: 0
  });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return clearOAuthCookie(
      NextResponse.redirect(
        settingsOAuthRedirect(oauthError === "access_denied" ? "access_denied" : oauthError)
      )
    );
  }

  const config = getWhatsAppOAuthConfig();
  if (!config) {
    return clearOAuthCookie(
      NextResponse.redirect(settingsOAuthRedirect("whatsapp_not_configured"))
    );
  }

  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  if (!code) {
    return clearOAuthCookie(NextResponse.redirect(settingsOAuthRedirect("missing_code")));
  }
  if (!state) {
    return clearOAuthCookie(NextResponse.redirect(settingsOAuthRedirect("invalid_state")));
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieNonce = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WHATSAPP_OAUTH_STATE_COOKIE}=`))
    ?.slice(`${WHATSAPP_OAUTH_STATE_COOKIE}=`.length);

  try {
    const payload = verifyWhatsAppOAuthState(state, config.stateSecret);
    if (!cookieNonce || cookieNonce !== payload.nonce) {
      return clearOAuthCookie(NextResponse.redirect(settingsOAuthRedirect("invalid_state")));
    }

    const tokens = await completeWhatsAppOAuth(code, config);
    const client = getConvexClient();
    await client.action(STORE_WHATSAPP_OAUTH_TOKEN, {
      secret: getInternalJobSecret(),
      propertyId: payload.propertyId as Id<"property">,
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      phoneNumberId: tokens.phoneNumberId
    });

    return clearOAuthCookie(NextResponse.redirect(settingsOAuthRedirect()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "store_failed";
    if (message === "invalid_state") {
      return clearOAuthCookie(NextResponse.redirect(settingsOAuthRedirect("invalid_state")));
    }
    if (message === "token_exchange_failed" || message.includes("token")) {
      return clearOAuthCookie(
        NextResponse.redirect(settingsOAuthRedirect("token_exchange_failed"))
      );
    }
    return clearOAuthCookie(NextResponse.redirect(settingsOAuthRedirect("store_failed")));
  }
}

import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import {
  WHATSAPP_OAUTH_STATE_COOKIE,
  buildWhatsAppAuthorizeUrl,
  createOAuthNonce,
  getWhatsAppOAuthConfig,
  settingsOAuthRedirect,
  signWhatsAppOAuthState
} from "@/lib/whatsapp-oauth";

const STATE_TTL_MS = 10 * 60 * 1000;

function isPropertyId(value: string): boolean {
  return /^[a-z0-9]{16,}$/i.test(value);
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(settingsOAuthRedirect("unauthorized"));
  }

  const config = getWhatsAppOAuthConfig();
  if (!config) {
    return NextResponse.redirect(settingsOAuthRedirect("whatsapp_not_configured"));
  }

  const propertyId = new URL(request.url).searchParams.get("propertyId")?.trim();
  if (!propertyId || !isPropertyId(propertyId)) {
    return NextResponse.redirect(settingsOAuthRedirect("invalid_state"));
  }

  const nonce = createOAuthNonce();
  const state = signWhatsAppOAuthState(
    {
      propertyId,
      nonce,
      exp: Date.now() + STATE_TTL_MS
    },
    config.stateSecret
  );

  const response = NextResponse.redirect(buildWhatsAppAuthorizeUrl(config, state));
  response.cookies.set(WHATSAPP_OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/oauth/whatsapp",
    maxAge: STATE_TTL_MS / 1000
  });
  return response;
}

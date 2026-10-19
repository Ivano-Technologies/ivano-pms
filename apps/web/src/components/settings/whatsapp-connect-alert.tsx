"use client";

import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { ErrorRef } from "@/components/ui/error-ref";
import { reportError } from "@/lib/friendly-error";
import { toWhatsAppConnectError } from "@/lib/whatsapp-connect-error";
import type { Id } from "../../../../../convex/_generated/dataModel";

/**
 * IVA-189: friendly WhatsApp connect error on Settings. A short message, at most one action and
 * the muted ref. The raw OAuth code is only logged, together with the ref.
 */
export function WhatsAppConnectAlert({
  code,
  serverRef,
  propertyId
}: {
  code: string;
  serverRef?: string | null;
  propertyId?: Id<"property">;
}) {
  const friendly = useMemo(() => toWhatsAppConnectError(code, serverRef), [code, serverRef]);

  useEffect(() => {
    reportError(
      new Error(`WhatsApp connect failed: ${code}`),
      `settings/whatsapp-connect ${friendly.kind}`,
      friendly.ref
    );
  }, [code, friendly.kind, friendly.ref]);

  const startHref = propertyId
    ? `/api/oauth/whatsapp/start?propertyId=${encodeURIComponent(propertyId)}`
    : undefined;

  return (
    <div
      role="alert"
      data-testid="whatsapp-connect-error"
      className="border-destructive/40 bg-destructive/10 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
    >
      <div>
        <p className="text-destructive text-sm">{friendly.message}</p>
        <ErrorRef code={friendly.ref} />
      </div>
      {friendly.actionLabel && startHref ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={startHref}>{friendly.actionLabel}</a>
        </Button>
      ) : null}
    </div>
  );
}

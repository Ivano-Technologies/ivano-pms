import PostalMime from "postal-mime";

import { buildForwardPayload, type ForwardPayload } from "./payload";

export { buildForwardPayload, type ForwardPayload } from "./payload";

export interface Env {
  PMS_WEBHOOK_URL: string;
  EMAIL_WEBHOOK_SECRET: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(raw);
    const payload = buildForwardPayload(parsed);

    if (!payload) {
      console.error("[email-inbound] missing to/from after parse");
      return;
    }

    const webhookUrl = env.PMS_WEBHOOK_URL?.trim();
    const secret = env.EMAIL_WEBHOOK_SECRET?.trim();
    if (!webhookUrl || !secret) {
      console.error("[email-inbound] PMS_WEBHOOK_URL or EMAIL_WEBHOOK_SECRET not set");
      return;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-email-webhook-secret": secret
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email-inbound] webhook failed", response.status, body);
    }
  }
};

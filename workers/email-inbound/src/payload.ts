export type ParsedEmail = {
  to?: Array<string | { address?: string; name?: string }>;
  from?: string | { address?: string; name?: string };
  subject?: string;
  text?: string;
  html?: string;
  headers?: { get(name: string): string | null };
};

export type ForwardPayload = {
  toAddress: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  textBody: string;
};

function pickRecipientAddress(message: ParsedEmail): string {
  const to = message.to?.[0];
  if (typeof to === "string") {
    return to;
  }
  if (to && typeof to === "object" && to.address) {
    return to.address;
  }

  const delivered = message.headers?.get("delivered-to");
  if (delivered) {
    return delivered;
  }

  return "";
}

function pickFromAddress(message: ParsedEmail): {
  fromAddress: string;
  fromName?: string;
} {
  const from = message.from;
  if (typeof from === "string") {
    return { fromAddress: from };
  }
  if (from && typeof from === "object" && from.address) {
    return {
      fromAddress: from.address,
      fromName: from.name || undefined
    };
  }
  return { fromAddress: "" };
}

export function buildForwardPayload(message: ParsedEmail): ForwardPayload | null {
  const toAddress = pickRecipientAddress(message).trim();
  const { fromAddress, fromName } = pickFromAddress(message);
  const normalizedFrom = fromAddress.trim();

  if (!toAddress || !normalizedFrom) {
    return null;
  }

  return {
    toAddress,
    fromAddress: normalizedFrom,
    fromName,
    subject: message.subject?.trim() ?? "",
    textBody: message.text?.trim() ?? message.html?.trim() ?? ""
  };
}

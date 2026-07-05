export const INBOUND_EMAIL_DOMAIN = "pms.techivano.com";
export const INBOUND_EMAIL_LOCAL_PREFIX = "booking";

export function slugifyPropertyName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug.length > 0 ? slug : "property";
}

export function formatInboundEmailAddress(
  slug: string,
  domain: string = INBOUND_EMAIL_DOMAIN
): string {
  return `${INBOUND_EMAIL_LOCAL_PREFIX}+${slug}@${domain}`;
}

/**
 * Parses booking+<property-slug>@domain (plus-addressing).
 * Returns null when the address is not a recognized property inbox route.
 */
export function parseBookingPlusAddress(
  address: string,
  domain: string = INBOUND_EMAIL_DOMAIN
): { slug: string } | null {
  const trimmed = address.trim();
  const angle = trimmed.indexOf("<");
  const bare =
    angle >= 0 && trimmed.endsWith(">")
      ? trimmed.slice(angle + 1, -1).trim()
      : trimmed;

  const normalized = bare.toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at === -1) {
    return null;
  }

  const local = normalized.slice(0, at);
  const addrDomain = normalized.slice(at + 1);
  if (addrDomain !== domain.toLowerCase()) {
    return null;
  }

  const prefix = `${INBOUND_EMAIL_LOCAL_PREFIX}+`;
  if (!local.startsWith(prefix)) {
    return null;
  }

  const slug = local.slice(prefix.length);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return null;
  }

  return { slug };
}

export function formatEmailMessageBody(subject: string, textBody: string): string {
  const subjectLine = subject.trim() || "(no subject)";
  const body = textBody.trim() || "(empty message)";
  return `Subject: ${subjectLine}\n\n${body}`;
}

export function displayNameFromEmail(
  fromName: string | undefined,
  fromAddress: string
): string {
  const name = fromName?.trim();
  if (name) {
    return name;
  }
  return fromAddress.trim() || "Email guest";
}

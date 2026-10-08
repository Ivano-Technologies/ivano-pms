export const WHATSAPP_GRAPH_API_VERSION = "v21.0";

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    throw new Error("WhatsApp recipient phone is required");
  }
  return digits;
}

export function buildWhatsAppMessagesUrl(
  phoneNumberId: string,
  version = WHATSAPP_GRAPH_API_VERSION
): string {
  const id = phoneNumberId.trim();
  if (!id) {
    throw new Error("WhatsApp phone number ID is missing");
  }
  return `https://graph.facebook.com/${version}/${id}/messages`;
}

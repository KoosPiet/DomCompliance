/**
 * Minimal Meta WhatsApp Cloud API client for sending payslip documents.
 *
 * All calls are gated on configuration: when the WhatsApp env vars are unset
 * (the common case in early deployments) {@link isWhatsappConfigured} returns
 * false and callers fall back to a wa.me click-to-chat link instead.
 */

import { env } from "@/env";

export function isWhatsappConfigured(): boolean {
  return Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Normalise a South African number to E.164 digits (no +). e.g. 082… -> 2782…. */
export function normaliseZaPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.length === 9) return `27${digits}`; // missing leading zero
  return digits;
}

/** Build a wa.me click-to-chat URL with a pre-filled message. */
export function waMeLink(phone: string, message: string): string {
  return `https://wa.me/${normaliseZaPhone(phone)}?text=${encodeURIComponent(message)}`;
}

function apiBase(): string {
  return `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` };
}

/** Upload a PDF and return the media id. */
export async function uploadMedia(bytes: Uint8Array, filename: string): Promise<string> {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "application/pdf");
  form.append("file", new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);

  const res = await fetch(`${apiBase()}/media`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  const data = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? `WhatsApp media upload failed (${res.status})`);
  }
  return data.id;
}

/** Send a document message by media id. Returns the provider message id. */
export async function sendDocument(params: {
  to: string;
  mediaId: string;
  filename: string;
  caption?: string;
}): Promise<string> {
  const res = await fetch(`${apiBase()}/messages`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normaliseZaPhone(params.to),
      type: "document",
      document: { id: params.mediaId, filename: params.filename, caption: params.caption },
    }),
  });
  const data = (await res.json()) as {
    messages?: { id: string }[];
    error?: { message?: string };
  };
  if (!res.ok || !data.messages?.[0]?.id) {
    throw new Error(data.error?.message ?? `WhatsApp send failed (${res.status})`);
  }
  return data.messages[0].id;
}

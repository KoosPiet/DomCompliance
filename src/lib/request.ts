import { headers } from "next/headers";

/** Best-effort client IP from proxy headers (Vercel/Supabase edge). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "unknown";
}

/** IP + UA together, for audit logging and rate-limit keys. */
export async function getRequestContext() {
  const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);
  return { ip, userAgent };
}

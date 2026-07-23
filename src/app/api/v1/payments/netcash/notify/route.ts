import { NextResponse } from "next/server";
import { parseNetcashNotification } from "@/lib/netcash/paynow";
import { applyNetcashNotification } from "@/server/services/billing";

/**
 * Netcash Pay Now notification (ITN) endpoint — the authoritative signal that a
 * payment succeeded or failed. Netcash posts server-to-server, so this must not
 * require a session. Activation is idempotent (see applyNetcashNotification).
 *
 * NOTE: In the Netcash NetConnector settings, the "Notify" URL for this Pay Now
 * service must point here:  {APP_URL}/api/v1/payments/netcash/notify
 * (the LabourMate deployment shares TrailTime's Netcash account — use a
 * dedicated Pay Now service for LabourMate, or update the notify URL).
 */

export const runtime = "nodejs";

async function readFields(request: Request): Promise<Record<string, string>> {
  const raw: Record<string, string> = {};

  // Query params (some configurations append the result to the URL).
  new URL(request.url).searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") raw[key] = value;
      }
    } else {
      const body = await request.text();
      if (body) {
        new URLSearchParams(body).forEach((value, key) => {
          raw[key] = value;
        });
      }
    }
  } catch {
    // Body already consumed / unparseable — fall back to whatever we have.
  }

  return raw;
}

export async function POST(request: Request): Promise<NextResponse> {
  const raw = await readFields(request);
  const notification = parseNetcashNotification(raw);

  if (!notification.reference) {
    // Nothing actionable, but acknowledge so Netcash does not retry endlessly.
    return new NextResponse("OK", { status: 200 });
  }

  const eventId = notification.transactionId || notification.reference;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  try {
    await applyNetcashNotification(notification, { eventId, ip, userAgent });
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[netcash] Notification processing failed:", error);
    // 500 lets Netcash retry the notification later.
    return new NextResponse("ERROR", { status: 500 });
  }
}

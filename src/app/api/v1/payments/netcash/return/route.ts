import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

/**
 * Browser return target after a Netcash Pay Now transaction. Netcash may return
 * the customer via GET or POST, so both are handled here and normalised into a
 * clean 303 redirect to the friendly status page. The status page reads the
 * authoritative payment state from the database (not from these params).
 */

const VALID = new Set(["success", "declined", "pending"]);

function redirectToStatus(request: Request): NextResponse {
  const params = new URL(request.url).searchParams;
  const requested = params.get("status") ?? "pending";
  const status = VALID.has(requested) ? requested : "pending";
  const ref = params.get("ref") ?? "";

  const target = new URL(`/payment/${status}`, siteConfig.url);
  if (ref) target.searchParams.set("ref", ref);

  return NextResponse.redirect(target, 303);
}

export async function GET(request: Request): Promise<NextResponse> {
  return redirectToStatus(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  // Drain the body so the connection closes cleanly, then redirect.
  try {
    await request.text();
  } catch {
    /* ignore */
  }
  return redirectToStatus(request);
}

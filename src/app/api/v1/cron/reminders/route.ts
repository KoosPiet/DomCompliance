import { env } from "@/env";
import { safeEqual } from "@/lib/crypto/pii";
import { runDueReminders } from "@/server/services/reminder";

/**
 * Scheduled job: dispatch all due reminders. Secured by CRON_SECRET — Vercel
 * Cron automatically sends `Authorization: Bearer <CRON_SECRET>`. A `?secret=`
 * query param is also accepted for manual/external schedulers.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const fromHeader = header.startsWith("Bearer ") ? header.slice(7) : "";
  const fromQuery = new URL(request.url).searchParams.get("secret") ?? "";
  const provided = fromHeader || fromQuery;
  return provided.length > 0 && safeEqual(provided, secret);
}

async function handle(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const result = await runDueReminders();
  return Response.json({ ok: true, ...result });
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}

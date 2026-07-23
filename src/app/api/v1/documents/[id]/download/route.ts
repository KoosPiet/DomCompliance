import { auth } from "@/auth";
import { resolveDocumentDownload, DocumentError } from "@/server/services/document";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const url = await resolveDocumentDownload(session.user.id, id);
    return new Response(null, {
      status: 302,
      headers: { Location: url, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    if (e instanceof DocumentError) {
      return new Response(e.message, { status: e.code === "NOT_FOUND" ? 404 : 503 });
    }
    throw e;
  }
}

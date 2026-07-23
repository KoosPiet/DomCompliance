import { auth } from "@/auth";
import { renderPayslipBytes, PayslipError } from "@/server/services/payslip";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  let result;
  try {
    result = await renderPayslipBytes(session.user.id, id);
  } catch (e) {
    if (e instanceof PayslipError) return new Response("Not found", { status: 404 });
    throw e;
  }

  return new Response(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

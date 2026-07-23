import { auth } from "@/auth";
import {
  getContractForPdf,
  toPdfInput,
  ContractError,
} from "@/server/services/contract";
import { renderContractPdf } from "@/lib/pdf/contract-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  let contract;
  try {
    contract = await getContractForPdf(session.user.id, id);
  } catch (e) {
    if (e instanceof ContractError) return new Response("Not found", { status: 404 });
    throw e;
  }

  const bytes = await renderContractPdf(toPdfInput(contract));

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${contract.contractNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

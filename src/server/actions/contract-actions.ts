"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import {
  signContractSchema,
  type SignContractInput,
} from "@/lib/validations/contract";
import {
  generateContract,
  signContract,
  ContractError,
} from "@/server/services/contract";

/** Generate a contract from an employee record and open it. Bound with the
 *  employee id, so it can be used directly as a `<form action>`. */
export async function generateContractAction(employeeId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  const id = await generateContract(session.user.id, employeeId, ctx);
  redirect(`/contracts/${id}`);
}

export type SignActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function signContractAction(
  contractId: string,
  input: SignContractInput,
): Promise<SignActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = signContractSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please provide your name and signature.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  try {
    await signContract(session.user.id, contractId, parsed.data, ctx);
  } catch (e) {
    if (e instanceof ContractError) return { ok: false, message: e.message };
    throw e;
  }

  redirect(`/contracts/${contractId}`);
}

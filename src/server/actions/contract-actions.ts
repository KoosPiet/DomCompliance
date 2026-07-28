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
  softDeleteContract,
  ContractError,
} from "@/server/services/contract";
import { EmployeeError } from "@/server/services/employee";

export type ContractActionResult = { ok: true } | { ok: false; message: string };

/**
 * Generate a contract from an employee record and open it. Returns a message
 * on failure rather than throwing — a rejected action (e.g. the employee has
 * left) must read as an explanation, not a crashed page.
 */
export async function generateContractAction(
  employeeId: string,
): Promise<ContractActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  let id: string;
  try {
    id = await generateContract(session.user.id, employeeId, ctx);
  } catch (e) {
    if (e instanceof EmployeeError || e instanceof ContractError) {
      return { ok: false, message: e.message };
    }
    throw e;
  }

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
    if (e instanceof ContractError || e instanceof EmployeeError) {
      return { ok: false, message: e.message };
    }
    throw e;
  }

  redirect(`/contracts/${contractId}`);
}

/** Soft-delete a contract and return to the employee it belonged to. */
export async function deleteContractAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  let employeeId: string;
  try {
    employeeId = await softDeleteContract(session.user.id, id, ctx);
  } catch {
    // Already gone — land on the employees list.
    redirect("/employees");
  }

  redirect(`/employees/${employeeId}`);
}

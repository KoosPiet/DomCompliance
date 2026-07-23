"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import { employeeSchema, type EmployeeInput } from "@/lib/validations/employee";
import {
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
  EmployeeError,
} from "@/server/services/employee";

export type EmployeeActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      code?: "PLAN_LIMIT";
    };

function invalid(input: EmployeeInput) {
  const parsed = employeeSchema.safeParse(input);
  if (parsed.success) return { data: parsed.data as EmployeeInput, error: null };
  return {
    data: null,
    error: {
      ok: false as const,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    },
  };
}

export async function createEmployeeAction(
  input: EmployeeInput,
): Promise<EmployeeActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { data, error } = invalid(input);
  if (error) return error;

  const ctx = await getRequestContext();
  let id: string;
  try {
    id = await createEmployee(session.user.id, data, ctx);
  } catch (e) {
    if (e instanceof EmployeeError && e.code === "PLAN_LIMIT") {
      return { ok: false, message: e.message, code: "PLAN_LIMIT" };
    }
    throw e;
  }

  redirect(`/employees/${id}`);
}

export async function updateEmployeeAction(
  id: string,
  input: EmployeeInput,
): Promise<EmployeeActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { data, error } = invalid(input);
  if (error) return error;

  const ctx = await getRequestContext();
  try {
    await updateEmployee(session.user.id, id, data, ctx);
  } catch (e) {
    if (e instanceof EmployeeError && e.code === "NOT_FOUND") {
      return { ok: false, message: "Employee not found." };
    }
    throw e;
  }

  redirect(`/employees/${id}`);
}

export async function deleteEmployeeAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  try {
    await softDeleteEmployee(session.user.id, id, ctx);
  } catch {
    // Already gone — fall through to the list.
  }

  redirect("/employees");
}

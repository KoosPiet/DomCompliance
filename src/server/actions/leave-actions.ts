"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import { logLeaveSchema, type LogLeaveInput } from "@/lib/validations/leave";
import { logLeave, updateLeave, deleteLeave } from "@/server/services/leave";
import { EmployeeError } from "@/server/services/employee";

export type LeaveActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function logLeaveAction(input: LogLeaveInput): Promise<LeaveActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = logLeaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  try {
    await logLeave(session.user.id, parsed.data, ctx);
  } catch (e) {
    if (e instanceof EmployeeError) {
      return { ok: false, message: "Selected employee was not found." };
    }
    throw e;
  }

  redirect("/leave");
}

export async function updateLeaveAction(
  id: string,
  input: LogLeaveInput,
): Promise<LeaveActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = logLeaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  try {
    await updateLeave(session.user.id, id, parsed.data, ctx);
  } catch (e) {
    if (e instanceof EmployeeError) {
      return { ok: false, message: "Selected employee was not found." };
    }
    throw e;
  }

  redirect("/leave");
}

export async function deleteLeaveAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  await deleteLeave(session.user.id, id, ctx);
  redirect("/leave");
}

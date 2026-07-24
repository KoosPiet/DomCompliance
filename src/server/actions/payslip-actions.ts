"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import { payslipSchema, type PayslipInput } from "@/lib/validations/payslip";
import { createPayslip, updatePayslip, PayslipError } from "@/server/services/payslip";
import { EmployeeError } from "@/server/services/employee";
import {
  sendPayslipEmail,
  sendPayslipWhatsapp,
  type WhatsappDeliveryResult,
} from "@/server/services/payslip-delivery";

export type PayslipActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      code?: "PLAN_LIMIT" | "DUPLICATE";
    };

export async function createPayslipAction(
  input: PayslipInput,
): Promise<PayslipActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = payslipSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  let id: string;
  try {
    id = await createPayslip(session.user.id, parsed.data, ctx);
  } catch (e) {
    if (e instanceof PayslipError) {
      return {
        ok: false,
        message: e.message,
        code: e.code === "NOT_FOUND" ? undefined : e.code,
      };
    }
    if (e instanceof EmployeeError) {
      return { ok: false, message: "Selected employee was not found." };
    }
    throw e;
  }

  redirect(`/payslips/${id}`);
}

export async function updatePayslipAction(
  id: string,
  input: PayslipInput,
): Promise<PayslipActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = payslipSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  try {
    await updatePayslip(session.user.id, id, parsed.data, ctx);
  } catch (e) {
    if (e instanceof PayslipError) {
      return {
        ok: false,
        message: e.message,
        code: e.code === "NOT_FOUND" ? undefined : e.code,
      };
    }
    if (e instanceof EmployeeError) {
      return { ok: false, message: "Selected employee was not found." };
    }
    throw e;
  }

  redirect(`/payslips/${id}`);
}

export type EmailActionResult = { status: "sent" | "skipped" | "error"; message: string };

export async function sendPayslipEmailAction(id: string): Promise<EmailActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  try {
    const result = await sendPayslipEmail(session.user.id, id, ctx);
    if (result.delivered) return { status: "sent", message: "Payslip emailed to the employee." };
    if (result.skipped)
      return {
        status: "skipped",
        message: "Email is not configured yet (set RESEND_API_KEY).",
      };
    return { status: "error", message: result.error ?? "Could not send the email." };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Could not send the email." };
  }
}

export async function sendPayslipWhatsappAction(id: string): Promise<WhatsappDeliveryResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  try {
    return await sendPayslipWhatsapp(session.user.id, id, ctx);
  } catch (e) {
    return { mode: "error", error: e instanceof Error ? e.message : "WhatsApp send failed." };
  }
}

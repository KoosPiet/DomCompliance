import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { sendEmail } from "@/lib/email/resend";
import {
  isWhatsappConfigured,
  uploadMedia,
  sendDocument,
  waMeLink,
} from "@/lib/whatsapp/client";
import {
  renderPayslipBytes,
  markPayslipDelivered,
  PayslipError,
} from "@/server/services/payslip";
import { monthLabel } from "@/lib/validations/payslip";

interface Ctx {
  ip?: string;
  userAgent?: string;
}

async function loadForDelivery(userId: string, id: string) {
  const payslip = await prisma.payslip.findFirst({
    where: { id, userId, deletedAt: null },
    include: { employee: true },
  });
  if (!payslip) throw new PayslipError("NOT_FOUND", "Payslip not found.");
  return payslip;
}

function messageFor(firstName: string, period: string): string {
  return `Hello ${firstName}\nYour payslip for ${period} is attached.\nThank you.`;
}

export interface EmailDeliveryResult {
  delivered: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendPayslipEmail(
  userId: string,
  id: string,
  ctx: Ctx = {},
): Promise<EmailDeliveryResult> {
  const payslip = await loadForDelivery(userId, id);
  const to = payslip.employee.email;
  if (!to) return { delivered: false, error: "This employee has no email address." };

  const period = `${monthLabel(payslip.periodMonth)} ${payslip.periodYear}`;
  const name = payslip.employee.firstName;
  const { bytes, fileName } = await renderPayslipBytes(userId, id);

  const result = await sendEmail({
    to,
    subject: `Your payslip for ${period}`,
    html: `<p>Hello ${name},</p><p>Your payslip for <strong>${period}</strong> is attached.</p><p>Thank you.</p>`,
    text: messageFor(name, period),
    attachments: [{ filename: fileName, content: Buffer.from(bytes) }],
  });

  if (result.delivered) {
    await markPayslipDelivered(userId, id, "email");
    await recordAudit({
      action: "SEND",
      entityType: "Payslip",
      entityId: id,
      actorId: userId,
      description: `Emailed payslip ${payslip.payslipNumber} to ${to}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
  return result;
}

export type WhatsappDeliveryResult =
  | { mode: "sent"; providerMessageId: string }
  | { mode: "fallback"; url: string; message: string }
  | { mode: "error"; error: string };

export async function sendPayslipWhatsapp(
  userId: string,
  id: string,
  ctx: Ctx = {},
): Promise<WhatsappDeliveryResult> {
  const payslip = await loadForDelivery(userId, id);
  const number = payslip.employee.whatsapp || payslip.employee.phone;
  if (!number) return { mode: "error", error: "This employee has no WhatsApp or phone number." };

  const period = `${monthLabel(payslip.periodMonth)} ${payslip.periodYear}`;
  const message = messageFor(payslip.employee.firstName, period);

  // Without Cloud API credentials, fall back to a click-to-chat link.
  if (!isWhatsappConfigured()) {
    return { mode: "fallback", url: waMeLink(number, message), message };
  }

  try {
    const { bytes, fileName } = await renderPayslipBytes(userId, id);
    const mediaId = await uploadMedia(bytes, fileName);
    const providerMessageId = await sendDocument({
      to: number,
      mediaId,
      filename: fileName,
      caption: message,
    });

    await prisma.whatsAppMessage.create({
      data: {
        userId,
        employeeId: payslip.employeeId,
        status: "SENT",
        toNumber: number,
        body: message,
        providerMessageId,
        payslipId: id,
        sentAt: new Date(),
      },
    });
    await markPayslipDelivered(userId, id, "whatsapp");
    await recordAudit({
      action: "SEND",
      entityType: "Payslip",
      entityId: id,
      actorId: userId,
      description: `Sent payslip ${payslip.payslipNumber} via WhatsApp`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { mode: "sent", providerMessageId };
  } catch (e) {
    const error = e instanceof Error ? e.message : "WhatsApp send failed";
    await prisma.whatsAppMessage.create({
      data: {
        userId,
        employeeId: payslip.employeeId,
        status: "FAILED",
        toNumber: number,
        body: message,
        payslipId: id,
        error,
      },
    });
    return { mode: "error", error };
  }
}

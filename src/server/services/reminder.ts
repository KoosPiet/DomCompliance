import { addMonths, addYears } from "date-fns";
import type { ReminderFrequency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { sendEmail } from "@/lib/email/resend";
import type { ReminderInput } from "@/lib/validations/reminder";

interface Ctx {
  ip?: string;
  userAgent?: string;
}

function advance(from: Date, frequency: ReminderFrequency): Date {
  if (frequency === "ANNUALLY") return addYears(from, 1);
  if (frequency === "MONTHLY") return addMonths(from, 1);
  return from;
}

/** Next occurrence of a given day-of-month, today or in the future. */
function nextMonthlyOn(day: number): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const clamp = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
  };
  let candidate = clamp(now.getFullYear(), now.getMonth());
  if (candidate < today) candidate = clamp(now.getFullYear(), now.getMonth() + 1);
  return candidate;
}

export function listReminders(userId: string) {
  return prisma.reminder.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { employee: { select: { firstName: true, lastName: true } } },
  });
}

export function getUpcomingReminders(userId: string, limit = 5) {
  return prisma.reminder.findMany({
    where: { userId, deletedAt: null, status: "PENDING" },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
}

export async function createReminder(
  userId: string,
  input: ReminderInput,
  ctx: Ctx = {},
): Promise<string> {
  const dueDate = new Date(input.dueDate);
  const reminder = await prisma.reminder.create({
    data: {
      userId,
      type: input.type,
      frequency: input.frequency,
      status: "PENDING",
      title: input.title.trim(),
      description: input.description?.trim() || null,
      dueDate,
      nextRunAt: dueDate,
      channelEmail: input.channelEmail,
      channelWhatsapp: input.channelWhatsapp,
    },
  });

  await recordAudit({
    action: "CREATE",
    entityType: "Reminder",
    entityId: reminder.id,
    actorId: userId,
    description: `Created reminder “${reminder.title}”`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return reminder.id;
}

export async function completeReminder(userId: string, id: string): Promise<void> {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId, deletedAt: null } });
  if (!reminder) return;

  if (reminder.frequency === "ONCE") {
    await prisma.reminder.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  } else {
    const next = advance(reminder.nextRunAt ?? reminder.dueDate, reminder.frequency);
    await prisma.reminder.update({
      where: { id },
      data: { dueDate: next, nextRunAt: next, completedAt: new Date(), status: "PENDING" },
    });
  }
}

export async function dismissReminder(userId: string, id: string): Promise<void> {
  await prisma.reminder.updateMany({
    where: { id, userId, deletedAt: null },
    data: { status: "DISMISSED" },
  });
}

export async function deleteReminder(userId: string, id: string): Promise<void> {
  await prisma.reminder.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
}

/** Provision the standard monthly compliance reminders (idempotent). */
export async function ensureDefaultReminders(userId: string): Promise<number> {
  const existing = await prisma.reminder.count({ where: { userId, deletedAt: null } });
  if (existing > 0) return 0;

  const defaults: Array<{
    type: ReminderInput["type"];
    title: string;
    description: string;
    dueDate: Date;
    frequency: ReminderFrequency;
  }> = [
    {
      type: "GENERATE_PAYSLIP",
      title: "Generate payslips",
      description: "Create this month's payslips for your employees.",
      dueDate: nextMonthlyOn(25),
      frequency: "MONTHLY",
    },
    {
      type: "PAY_SALARY",
      title: "Pay salaries",
      description: "Pay your employees for the month.",
      dueDate: nextMonthlyOn(28),
      frequency: "MONTHLY",
    },
    {
      type: "SUBMIT_UIF",
      title: "Submit & pay UIF",
      description: "Declare and pay UIF via uFiling by the 7th.",
      dueDate: nextMonthlyOn(7),
      frequency: "MONTHLY",
    },
  ];

  await prisma.reminder.createMany({
    data: defaults.map((d) => ({
      userId,
      type: d.type,
      frequency: d.frequency,
      status: "PENDING" as const,
      title: d.title,
      description: d.description,
      dueDate: d.dueDate,
      nextRunAt: d.dueDate,
      channelEmail: true,
      channelWhatsapp: false,
    })),
  });

  await recordAudit({
    action: "CREATE",
    entityType: "Reminder",
    actorId: userId,
    description: "Set up standard monthly reminders",
  });
  return defaults.length;
}

/**
 * Process all due reminders across every account: emit a dashboard
 * notification, send email where enabled, then advance recurring reminders or
 * close one-off ones. Invoked by the scheduled cron job.
 */
export async function runDueReminders(now = new Date()): Promise<{ processed: number; emailed: number }> {
  const due = await prisma.reminder.findMany({
    where: { deletedAt: null, status: "PENDING", nextRunAt: { lte: now } },
    include: { user: { select: { email: true, name: true } } },
    take: 500,
  });

  let processed = 0;
  let emailed = 0;

  for (const reminder of due) {
    await prisma.notification.create({
      data: {
        userId: reminder.userId,
        reminderId: reminder.id,
        channel: "DASHBOARD",
        status: "SENT",
        type: "reminder",
        title: reminder.title,
        body: reminder.description ?? reminder.title,
        sentAt: now,
      },
    });

    if (reminder.channelEmail && reminder.user.email) {
      const name = reminder.user.name ?? "there";
      const result = await sendEmail({
        to: reminder.user.email,
        subject: `Reminder: ${reminder.title}`,
        html: `<p>Hi ${name},</p><p><strong>${reminder.title}</strong>${reminder.description ? ` — ${reminder.description}` : ""}</p><p>Log in to LabourMate to take care of it.</p>`,
        text: `${reminder.title}\n${reminder.description ?? ""}`,
      });
      if (result.delivered) emailed += 1;
    }

    if (reminder.frequency === "ONCE") {
      await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "SENT" } });
    } else {
      const next = advance(reminder.nextRunAt ?? reminder.dueDate, reminder.frequency);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { nextRunAt: next, dueDate: next },
      });
    }
    processed += 1;
  }

  return { processed, emailed };
}

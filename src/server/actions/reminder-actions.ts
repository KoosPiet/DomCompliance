"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import { reminderSchema, type ReminderInput } from "@/lib/validations/reminder";
import {
  createReminder,
  updateReminder,
  completeReminder,
  dismissReminder,
  deleteReminder,
  ensureDefaultReminders,
} from "@/server/services/reminder";

export type ReminderActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createReminderAction(input: ReminderInput): Promise<ReminderActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  await createReminder(session.user.id, parsed.data, ctx);
  redirect("/reminders");
}

export async function updateReminderAction(
  id: string,
  input: ReminderInput,
): Promise<ReminderActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  await updateReminder(session.user.id, id, parsed.data, ctx);
  redirect("/reminders");
}

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user.id;
}

export async function completeReminderAction(id: string): Promise<void> {
  const userId = await requireUser();
  await completeReminder(userId, id);
  redirect("/reminders");
}

export async function dismissReminderAction(id: string): Promise<void> {
  const userId = await requireUser();
  await dismissReminder(userId, id);
  redirect("/reminders");
}

export async function deleteReminderAction(id: string): Promise<void> {
  const userId = await requireUser();
  await deleteReminder(userId, id);
  redirect("/reminders");
}

export async function setupDefaultRemindersAction(): Promise<void> {
  const userId = await requireUser();
  await ensureDefaultReminders(userId);
  redirect("/reminders");
}

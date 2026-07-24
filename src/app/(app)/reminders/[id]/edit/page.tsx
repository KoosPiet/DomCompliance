import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import type { ReminderInput } from "@/lib/validations/reminder";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Edit reminder",
  path: "/reminders",
  noIndex: true,
});

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const reminder = await prisma.reminder.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!reminder) notFound();

  const defaults: Partial<ReminderInput> = {
    type: reminder.type as ReminderInput["type"],
    frequency: reminder.frequency as ReminderInput["frequency"],
    title: reminder.title,
    description: reminder.description ?? "",
    dueDate: reminder.dueDate.toISOString().slice(0, 10),
    channelEmail: reminder.channelEmail,
    channelWhatsapp: reminder.channelWhatsapp,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/reminders">
            <ArrowLeft className="size-4" /> Reminders
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit reminder</h1>
        <p className="mt-1 text-muted-foreground">
          Change the date, frequency or details — the schedule re-arms on save.
        </p>
      </div>
      <ReminderForm mode="edit" reminderId={id} defaultValues={defaults} />
    </div>
  );
}

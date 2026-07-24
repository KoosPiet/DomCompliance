import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Add reminder",
  path: "/reminders/new",
  noIndex: true,
});

export default async function NewReminderPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/reminders">
            <ArrowLeft className="size-4" /> Reminders
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Add reminder</h1>
        <p className="mt-1 text-muted-foreground">
          We&apos;ll notify you by email (and WhatsApp when connected) when it&apos;s due.
        </p>
      </div>
      <ReminderForm />
    </div>
  );
}

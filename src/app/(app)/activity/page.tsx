import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({
  title: "Activity log",
  path: "/activity",
  noIndex: true,
});

/** Action → badge styling. Deletes stand out; everything else stays calm. */
const ACTION_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  SIGN: "default",
  PAYMENT: "default",
  SEND: "secondary",
  EXPORT: "secondary",
  RESTORE: "secondary",
};

const fmt = (d: Date) =>
  d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const entries = await prisma.auditLog.findMany({
    where: { actorId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <History className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
          <p className="text-muted-foreground">
            Everything done on your account — contracts, payslips, leave, payments — with who and when.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <History className="size-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No activity yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Actions like adding an employee, generating a payslip or logging
            leave will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">What happened</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmt(e.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_VARIANT[e.action] ?? "secondary"}>
                      {e.action.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {e.description ?? `${e.entityType}${e.entityId ? ` ${e.entityId.slice(0, 8)}` : ""}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing your latest 100 actions. Records are kept permanently for
        compliance purposes.
      </p>
    </div>
  );
}

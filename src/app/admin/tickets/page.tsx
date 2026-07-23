import { LifeBuoy } from "lucide-react";
import { listTickets } from "@/server/services/admin";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({ title: "Admin · Support", path: "/admin/tickets", noIndex: true });

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  IN_PROGRESS: "secondary",
  RESOLVED: "outline",
  CLOSED: "outline",
};

export default async function AdminTicketsPage() {
  const tickets = await listTickets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
        <p className="mt-1 text-muted-foreground">{tickets.length} shown</p>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LifeBuoy className="size-6" />
          </div>
          <p className="mt-4 font-medium">No support tickets</p>
          <p className="mt-1 text-sm text-muted-foreground">Customer tickets will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.user.email}</td>
                  <td className="px-4 py-3">{t.priority.toLowerCase()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>
                      {t.status.replace("_", " ").toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t._count.messages}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.updatedAt.toLocaleDateString("en-ZA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

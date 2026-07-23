import Link from "next/link";
import { listAuditLogs } from "@/server/services/admin";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";

export const metadata = buildMetadata({ title: "Admin · Audit", path: "/admin/audit", noIndex: true });

const FILTERS = ["", "CREATE", "UPDATE", "DELETE", "SIGN", "SEND", "PAYMENT", "LOGIN"];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const logs = await listAuditLogs(action);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit logs</h1>
        <p className="mt-1 text-muted-foreground">Most recent {logs.length} events</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (action ?? "") === f;
          return (
            <Link key={f || "all"} href={f ? `/admin/audit?action=${f}` : "/admin/audit"}>
              <Badge variant={active ? "default" : "secondary"} className="cursor-pointer">
                {f ? f.toLowerCase() : "all"}
              </Badge>
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {log.createdAt.toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{log.action.toLowerCase()}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {log.actorEmail ?? log.actor?.email ?? "system"}
                </td>
                <td className="px-4 py-3">{log.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

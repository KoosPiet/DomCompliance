import { Search } from "lucide-react";
import { auth } from "@/auth";
import { listAdminUsers } from "@/server/services/admin";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRowActions } from "@/components/admin/user-row-actions";

export const metadata = buildMetadata({ title: "Admin · Users", path: "/admin/users", noIndex: true });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [session, users] = await Promise.all([auth(), listAdminUsers(q)]);
  // Only full ADMINs may manage accounts; SUPPORT sees the list read-only.
  const canManage = session?.user?.role === "ADMIN";
  const currentAdminId = session?.user?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">{users.length} shown</p>
      </div>

      <form action="/admin/users" className="flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q ?? ""} placeholder="Search email or name…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Employees</th>
              <th className="px-4 py-3 font-medium">Payslips</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === "OWNER" ? "secondary" : "default"}>{u.role.toLowerCase()}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.subscription?.status === "ACTIVE" ? "default" : "outline"}>
                    {u.subscription?.plan?.replace("PREMIUM_", "").toLowerCase() ?? "—"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.employees}</td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.payslips}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.createdAt.toLocaleDateString("en-ZA")}</td>
                {canManage && (
                  <td className="px-4 py-3">
                    <UserRowActions
                      user={{
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        isActive: u.isActive,
                      }}
                      currentAdminId={currentAdminId}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

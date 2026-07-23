import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ScrollText,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { logoutAction } from "@/server/actions/auth-actions";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/tickets", label: "Support", icon: LifeBuoy },
  { href: "/admin/audit", label: "Audit logs", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Back to app
            </Link>
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

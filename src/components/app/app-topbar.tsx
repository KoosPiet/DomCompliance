"use client";

import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  Vault,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/actions/auth-actions";

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function AppTopbar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: UserRole };
}) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPPORT";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <Link
              href="/employees"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Users className="size-4" />
              Employees
            </Link>
            <Link
              href="/payslips"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ReceiptText className="size-4" />
              Payslips
            </Link>
            <Link
              href="/leave"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="size-4" />
              Leave
            </Link>
            <Link
              href="/reminders"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <BellRing className="size-4" />
              Reminders
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Vault className="size-4" />
              Vault
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/compliance-check">
              <ShieldCheck className="size-4" />
              Compliance check
            </Link>
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user.name ?? "Your account"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/onboarding">
                  <UserRound className="size-4" />
                  Employer profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing">
                  <CreditCard className="size-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <ShieldAlert className="size-4" />
                    Admin panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <form action={logoutAction}>
                <button type="submit" className="w-full">
                  <DropdownMenuItem className="text-danger focus:text-danger">
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

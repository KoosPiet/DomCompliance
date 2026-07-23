import {
  BellRing,
  CalendarDays,
  LayoutDashboard,
  ReceiptText,
  Users,
  Vault,
} from "lucide-react";

/** A single primary-navigation entry, shared by the desktop bar and mobile menu. */
export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Primary app navigation — the single source of truth for both nav surfaces. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/payslips", label: "Payslips", icon: ReceiptText },
  { href: "/leave", label: "Leave", icon: CalendarDays },
  { href: "/reminders", label: "Reminders", icon: BellRing },
  { href: "/vault", label: "Vault", icon: Vault },
];

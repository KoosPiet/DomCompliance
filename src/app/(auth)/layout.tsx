import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <Logo />
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Brand column */}
      <div className="relative hidden overflow-hidden border-l bg-muted/30 lg:block">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <ShieldCheck className="size-10 text-primary" />
          <h2 className="mt-6 max-w-md text-3xl font-semibold tracking-tight">
            Compliance, handled.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            {siteConfig.description}
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Legally-sound employment contracts",
              "Payslips with UIF & PAYE calculated",
              "Automated UIF and salary reminders",
              "Every record encrypted and searchable",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

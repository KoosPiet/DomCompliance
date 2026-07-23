import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Free Compliance Check",
  description:
    "Answer 8 quick questions and get your free South African domestic-worker compliance score in 2 minutes. See exactly where you stand and what to fix.",
  path: "/compliance-check",
});

export default async function ComplianceCheckLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Session-aware so a logged-in user taking the check still sees they're signed
  // in and lands back in the app (not the public homepage) when they navigate.
  const session = await auth();
  const loggedIn = Boolean(session?.user);
  const backHref = loggedIn ? "/dashboard" : "/";

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo href={backHref} />
          <div className="flex items-center gap-1">
            <Link
              href={backHref}
              className="mr-1 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">
                {loggedIn ? "Back to dashboard" : "Home"}
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}

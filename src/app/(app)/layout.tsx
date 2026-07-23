import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppTopbar } from "@/components/app/app-topbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <AppTopbar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

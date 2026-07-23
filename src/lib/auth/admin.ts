import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";

/**
 * Guard for the admin area. Redirects non-admins away. ADMIN has full access;
 * SUPPORT is allowed in (read-mostly) for support tooling.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
    redirect("/dashboard");
  }
  return session;
}

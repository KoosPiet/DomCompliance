import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Edge-safe auth configuration.
 *
 * Contains only what the middleware needs to authorise requests from the JWT
 * — no database access, no bcrypt, no Node-only APIs. The full configuration
 * (Prisma adapter + Credentials provider) lives in `src/auth.ts` and spreads
 * this object.
 */

/** Route prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/employees",
  "/contracts",
  "/payslips",
  "/leave",
  "/documents",
  "/reminders",
  "/settings",
  "/billing",
  "/onboarding",
] as const;

/** Route prefix requiring an admin/support role. */
export const ADMIN_PREFIX = "/admin";

/** Auth pages an already-authenticated user should be redirected away from. */
export const AUTH_PAGES = ["/login", "/register"] as const;

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith(ADMIN_PREFIX)) {
        return user?.role === "ADMIN" || user?.role === "SUPPORT";
      }

      const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      );
      if (isProtected) return !!user;

      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "OWNER";
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      // Allow client-side session.update() to refresh verification state.
      const updated = session as { emailVerified?: Date } | undefined;
      if (trigger === "update" && updated?.emailVerified) {
        token.emailVerified = updated.emailVerified;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "OWNER";
        const ev = token.emailVerified as Date | string | number | null | undefined;
        session.user.emailVerified = ev ? new Date(ev) : null;
      }
      return session;
    },
  },
  providers: [], // real providers are added in src/auth.ts
} satisfies NextAuthConfig;

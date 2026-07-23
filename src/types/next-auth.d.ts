import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Module augmentation: expose the user id, role and email-verification state
 * on the session and JWT so they are strongly typed everywhere.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    emailVerified: Date | null;
  }
}

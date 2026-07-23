import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "@/auth.config";

/**
 * Full Auth.js v5 instance (Node runtime). Adds the Prisma adapter and the
 * Credentials provider whose `authorize` verifies the bcrypt password hash.
 * Sessions are JWT-based (required for Credentials).
 */
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash || user.deletedAt || !user.isActive) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // Best-effort last-login stamp; never blocks sign-in.
        await prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => undefined);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
});

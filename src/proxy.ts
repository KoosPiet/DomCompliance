import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, AUTH_PAGES } from "@/auth.config";

/**
 * Edge proxy (formerly "middleware"). Uses the DB-free auth config to read the
 * JWT and gate protected routes (via the `authorized` callback), and bounces
 * already-authenticated users away from the login/register pages.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  const onAuthPage = AUTH_PAGES.some((page) =>
    nextUrl.pathname.startsWith(page),
  );
  if (onAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protected-route enforcement is handled by the `authorized` callback,
  // which redirects unauthenticated users to the sign-in page.
  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals, static assets and the auth API.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};

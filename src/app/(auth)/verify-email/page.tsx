import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { consumeEmailVerificationToken } from "@/lib/auth/tokens";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Verify email",
  path: "/verify-email",
  noIndex: true,
});

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  let verified = false;
  if (token && email) {
    try {
      const userId = await consumeEmailVerificationToken(email, token);
      verified = Boolean(userId);
    } catch {
      verified = false;
    }
  }

  return (
    <div className="text-center">
      <div
        className={`mx-auto flex size-12 items-center justify-center rounded-full ${
          verified ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
        }`}
      >
        {verified ? (
          <CheckCircle2 className="size-6" />
        ) : (
          <XCircle className="size-6" />
        )}
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {verified ? "Email verified" : "Verification failed"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {verified
          ? "Thanks — your email address is confirmed. You're all set."
          : "This verification link is invalid or has expired. You can request a new one from your account settings."}
      </p>
      <Button asChild className="mt-6">
        <Link href={verified ? "/dashboard" : "/login"}>
          {verified ? "Go to dashboard" : "Back to sign in"}
        </Link>
      </Button>
    </div>
  );
}

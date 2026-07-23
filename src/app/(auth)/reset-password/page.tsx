import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Reset password",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This password reset link is missing or malformed. Please request a new
          one.
        </p>
        <Button asChild className="mt-6">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

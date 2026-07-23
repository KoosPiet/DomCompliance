import { buildMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = buildMetadata({
  title: "Forgot password",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

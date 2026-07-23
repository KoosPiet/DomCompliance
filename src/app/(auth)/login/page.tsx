import { buildMetadata } from "@/lib/seo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = buildMetadata({
  title: "Sign in",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <LoginForm />;
}

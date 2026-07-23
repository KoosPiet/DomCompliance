import { buildMetadata } from "@/lib/seo";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = buildMetadata({
  title: "Create your account",
  path: "/register",
});

export default function RegisterPage() {
  return <RegisterForm />;
}

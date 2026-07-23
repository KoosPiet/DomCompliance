import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import type { EmployerProfileInput } from "@/lib/validations/employer";

export const metadata = buildMetadata({
  title: "Set up your profile",
  path: "/onboarding",
  noIndex: true,
});

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const defaults: Partial<EmployerProfileInput> = {
    employerName: profile?.employerName ?? session.user.name ?? "",
    phone: profile?.phone ?? "",
    addressLine1: profile?.addressLine1 ?? "",
    addressLine2: profile?.addressLine2 ?? "",
    city: profile?.city ?? "",
    province:
      (profile?.province as EmployerProfileInput["province"]) ?? undefined,
    postalCode: profile?.postalCode ?? "",
    alternateEmail: profile?.alternateEmail ?? "",
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tell us about you
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          This information appears on the contracts and payslips you generate.
          You can change it anytime.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <OnboardingForm defaultValues={defaults} />
      </div>
    </div>
  );
}

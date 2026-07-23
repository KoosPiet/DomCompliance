import { auth } from "@/auth";
import { ComplianceWizard } from "@/components/compliance/compliance-wizard";

export default async function ComplianceCheckPage() {
  const session = await auth();
  return <ComplianceWizard isAuthenticated={Boolean(session?.user)} />;
}

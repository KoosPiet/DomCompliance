import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSignature,
  TriangleAlert,
} from "lucide-react";
import { auth } from "@/auth";
import { buildMetadata } from "@/lib/seo";
import { getContractView, ContractError } from "@/server/services/contract";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignContract } from "@/components/contracts/sign-contract";

export const metadata = buildMetadata({
  title: "Employment contract",
  path: "/contracts",
  noIndex: true,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  SIGNED: "default",
  PENDING_SIGNATURE: "secondary",
  DRAFT: "outline",
  ARCHIVED: "outline",
};

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  let view;
  try {
    view = await getContractView(session.user.id, id);
  } catch (e) {
    if (e instanceof ContractError) notFound();
    throw e;
  }

  const { contract, terms } = view;
  const isSigned = contract.status === "SIGNED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/employees/${contract.employeeId}`}>
            <ArrowLeft className="size-4" /> {view.employeeName}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Employment contract
            </h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {contract.contractNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[contract.status] ?? "outline"}>
              {contract.status.replace("_", " ").toLowerCase()}
            </Badge>
            <Button asChild variant="outline">
              <a href={`/contracts/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" /> PDF
              </a>
            </Button>
          </div>
        </div>
      </div>

      {terms.belowMinimumWage && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>
            The wage on this contract appears to be below the current National
            Minimum Wage for domestic workers. Please review before signing.
          </p>
        </div>
      )}

      {/* Key terms */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Key terms
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <Term label="Employee">{terms.employee.fullName}</Term>
          <Term label="Position">{terms.employee.occupationLabel}</Term>
          <Term label="Remuneration">
            {terms.salaryFormatted} {terms.payFrequencyLabel}
          </Term>
          <Term label="Ordinary hours">
            {terms.ordinaryHoursWeek}h / week ({terms.workingDaysPerWeek} days)
          </Term>
          <Term label="Annual leave">{terms.annualLeaveDays} days</Term>
          <Term label="Sick leave">{terms.sickLeaveDays} days / 3 yrs</Term>
        </dl>
      </div>

      {/* Sign / signed state */}
      {isSigned ? (
        <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-6">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" />
          <div>
            <p className="font-semibold">Signed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed by {contract.employerSignatureName} on{" "}
              {contract.employerSignedAt?.toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . A copy has been saved to your Document Vault.
            </p>
            <Button asChild variant="link" className="mt-1 h-auto p-0">
              <Link href="/vault">Open Document Vault →</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <FileSignature className="size-5 text-primary" />
            <h2 className="font-semibold">Sign this contract</h2>
          </div>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Sign digitally as the employer. Print or send the PDF for your
            employee to countersign.
          </p>
          <SignContract contractId={id} employerName={terms.employer.name} />
        </div>
      )}

      {/* Full contract text */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Full contract
        </h2>
        <div className="mt-4 space-y-5">
          {terms.clauses.map((clause) => (
            <section key={clause.number}>
              <h3 className="font-semibold">
                {clause.number}. {clause.heading}
              </h3>
              <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {clause.body.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

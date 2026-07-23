import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  FileSignature,
  Pencil,
  Plus,
  ReceiptText,
  Download,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import {
  getEmployee,
  decryptEmployeePii,
  EmployeeError,
} from "@/server/services/employee";
import { getEmployeeLeaveOverview } from "@/server/services/leave";
import { occupationLabel } from "@/lib/validations/employee";
import { leaveTypeLabel } from "@/lib/validations/leave";
import { monthLabel } from "@/lib/validations/payslip";
import { formatZar } from "@/domain/money";
import { generateContractAction } from "@/server/actions/contract-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteEmployeeButton } from "@/components/employees/delete-employee-button";
import { UploadDocument } from "@/components/vault/upload-document";

export const metadata = buildMetadata({
  title: "Employee",
  path: "/employees",
  noIndex: true,
});

const CONTRACT_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  SIGNED: "default",
  PENDING_SIGNATURE: "secondary",
  DRAFT: "outline",
  ARCHIVED: "outline",
};

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children || "—"}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2 divide-y">{children}</div>
    </div>
  );
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  let employee;
  try {
    employee = await getEmployee(session.user.id, id);
  } catch (e) {
    if (e instanceof EmployeeError) notFound();
    throw e;
  }

  const pii = decryptEmployeePii(employee);
  const [contracts, payslips, documents, leave] = await Promise.all([
    prisma.employmentContract.findMany({
      where: { employeeId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payslip.findMany({
      where: { employeeId: id, deletedAt: null },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      take: 6,
    }),
    prisma.document.findMany({
      where: { employeeId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { contract: { select: { id: true } } },
    }),
    getEmployeeLeaveOverview(session.user.id, id),
  ]);

  const generateContract = generateContractAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/employees">
            <ArrowLeft className="size-4" /> Employees
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {occupationLabel(employee.occupation, employee.otherOccupation)} ·{" "}
              <Badge variant="secondary" className="align-middle">
                {employee.status.replace("_", " ").toLowerCase()}
              </Badge>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action={generateContract}>
              <Button type="submit">
                <FileSignature className="size-4" /> Generate contract
              </Button>
            </form>
            <Button asChild variant="outline">
              <Link href={`/employees/${id}/edit`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
            <DeleteEmployeeButton id={id} name={`${employee.firstName} ${employee.lastName}`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Personal">
          <InfoRow label="SA ID number">{pii.idNumber}</InfoRow>
          <InfoRow label="Passport">{pii.passportNumber}</InfoRow>
          <InfoRow label="Start date">
            {employee.startDate.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
          </InfoRow>
        </Panel>

        <Panel title="Contact">
          <InfoRow label="Phone">{employee.phone}</InfoRow>
          <InfoRow label="WhatsApp">{employee.whatsapp}</InfoRow>
          <InfoRow label="Email">{employee.email}</InfoRow>
        </Panel>

        <Panel title="Employment">
          <InfoRow label="Salary">
            {formatZar(Number(employee.salary))} / {employee.payFrequency.toLowerCase()}
          </InfoRow>
          <InfoRow label="Working days / week">{employee.workingDaysPerWeek}</InfoRow>
          <InfoRow label="Ordinary hours / day">{Number(employee.ordinaryHoursDay)}</InfoRow>
          <InfoRow label="Schedule">{employee.scheduleNote}</InfoRow>
        </Panel>

        <Panel title="Banking">
          <InfoRow label="Bank">{employee.bankName}</InfoRow>
          <InfoRow label="Account holder">{employee.bankAccountHolder}</InfoRow>
          <InfoRow label="Account number">{pii.bankAccountMasked}</InfoRow>
          <InfoRow label="Branch code">{employee.bankBranchCode}</InfoRow>
        </Panel>

        <Panel title="Address">
          <InfoRow label="Street">{employee.addressLine1}</InfoRow>
          <InfoRow label="Suburb">{employee.addressLine2}</InfoRow>
          <InfoRow label="City">{employee.city}</InfoRow>
          <InfoRow label="Province">{employee.province}</InfoRow>
          <InfoRow label="Postal code">{employee.postalCode}</InfoRow>
        </Panel>

        <Panel title="Emergency contact">
          <InfoRow label="Name">{employee.emergencyName}</InfoRow>
          <InfoRow label="Phone">{employee.emergencyPhone}</InfoRow>
          <InfoRow label="Relationship">{employee.emergencyRelationship}</InfoRow>
        </Panel>
      </div>

      {employee.notes && (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{employee.notes}</p>
        </div>
      )}

      {/* Contracts */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Employment contracts</h2>
          <form action={generateContract}>
            <Button type="submit" size="sm" variant="outline">
              <FileSignature className="size-4" /> New contract
            </Button>
          </form>
        </div>
        {contracts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No contract yet. Generate a BCEA-compliant employment contract in one click.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {contracts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/contracts/${c.id}`} className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{c.contractNumber}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {c.effectiveDate.toLocaleDateString("en-ZA")}
                    </span>
                  </span>
                </Link>
                <Badge variant={CONTRACT_STATUS_VARIANT[c.status] ?? "outline"}>
                  {c.status.replace("_", " ").toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Payslips */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Payslips</h2>
          <Button asChild size="sm" variant="outline">
            <Link href={`/payslips/new?employeeId=${id}`}>
              <Plus className="size-4" /> New payslip
            </Link>
          </Button>
        </div>
        {payslips.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No payslips yet. UIF and PAYE are calculated automatically.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {payslips.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/payslips/${p.id}`} className="flex items-center gap-3">
                  <ReceiptText className="size-4 text-muted-foreground" />
                  <span className="font-medium">
                    {monthLabel(p.periodMonth)} {p.periodYear}
                  </span>
                </Link>
                <span className="text-sm font-medium">{formatZar(Number(p.netPay))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leave */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Leave balances</h2>
          <Button asChild size="sm" variant="outline">
            <Link href={`/leave/new?employeeId=${id}`}>
              <CalendarDays className="size-4" /> Log leave
            </Link>
          </Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {leave.balances.map((b) => (
            <div key={b.leaveType} className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">{b.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {b.balanceDays}
                <span className="text-xs font-normal text-muted-foreground"> days</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {b.takenDays} taken · {b.accruedDays} accrued
              </p>
            </div>
          ))}
        </div>
        {leave.requests.length > 0 && (
          <ul className="mt-4 divide-y">
            {leave.requests.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium">{leaveTypeLabel(r.leaveType)}</span>
                <span className="text-muted-foreground">
                  {r.startDate.toLocaleDateString("en-ZA")} · {Number(r.days)} day
                  {Number(r.days) === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Documents */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Documents</h2>
          <div className="flex items-center gap-2">
            <UploadDocument
              employees={[{ id, name: `${employee.firstName} ${employee.lastName}` }]}
              defaultEmployeeId={id}
              label="Upload"
            />
            <Button asChild size="sm" variant="ghost">
              <Link href="/vault">Open vault</Link>
            </Button>
          </div>
        </div>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Signed contracts, payslips and uploaded files (ID copies, bank letters) appear here.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{d.title}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {d.createdAt.toLocaleDateString("en-ZA")}
                    </span>
                  </span>
                </span>
                <Button asChild size="sm" variant="ghost">
                  <a
                    href={`/api/v1/documents/${d.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" /> Download
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

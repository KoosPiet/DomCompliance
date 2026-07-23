import { createHash } from "node:crypto";
import { customAlphabet } from "nanoid";
import type { Employee, EmployerProfile, Payslip, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { decryptPii, maskTail } from "@/lib/crypto/pii";
import { getEmployee } from "@/server/services/employee";
import { occupationLabel } from "@/lib/validations/employee";
import { monthLabel, toAmount, type PayslipInput } from "@/lib/validations/payslip";
import { calculatePayslip } from "@/domain/payroll/payslip";
import { renderPayslipPdf, type PayslipPdfInput } from "@/lib/pdf/payslip-pdf";

export class PayslipError extends Error {
  constructor(
    public readonly code: "PLAN_LIMIT" | "DUPLICATE" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "PayslipError";
  }
}

interface Ctx {
  ip?: string;
  userAgent?: string;
}

const payslipSuffix = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 5);

function payslipNumber(year: number, month: number): string {
  return `LM-P-${year}${String(month).padStart(2, "0")}-${payslipSuffix()}`;
}

function joinAddress(...parts: (string | null | undefined)[]): string | null {
  const value = parts.filter(Boolean).join(", ");
  return value || null;
}

export interface PayslipAllowance {
  used: number;
  limit: number | null;
  canAdd: boolean;
}

export async function getPayslipAllowance(userId: string): Promise<PayslipAllowance> {
  const [subscription, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.payslip.count({ where: { userId, deletedAt: null } }),
  ]);
  const limit = subscription?.payslipLimit ?? null;
  return { used, limit, canAdd: limit === null || used < limit };
}

/** Pure assembler: build the PDF input from persisted records. */
function buildPdfInput(
  payslip: Payslip,
  employee: Employee,
  profile: EmployerProfile | null,
  user: User | null,
): PayslipPdfInput {
  return {
    payslipNumber: payslip.payslipNumber,
    generatedAtIso: payslip.createdAt.toISOString(),
    employer: {
      name: profile?.employerName ?? user?.name ?? "The Employer",
      address: joinAddress(
        profile?.addressLine1,
        profile?.city,
        profile?.province,
        profile?.postalCode,
      ),
      uifReference: profile?.uifReferenceNumber ?? null,
    },
    employee: {
      fullName: `${employee.firstName} ${employee.lastName}`,
      idOrPassport: decryptPii(employee.idNumber) ?? decryptPii(employee.passportNumber),
      occupation: occupationLabel(employee.occupation, employee.otherOccupation),
      bankName: employee.bankName,
      bankAccountMasked: maskTail(decryptPii(employee.bankAccountNumber)),
    },
    period: {
      label: `${monthLabel(payslip.periodMonth)} ${payslip.periodYear}`,
      payDateLabel: payslip.payDate.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      rangeLabel: `${payslip.periodStart.toLocaleDateString("en-ZA")} – ${payslip.periodEnd.toLocaleDateString("en-ZA")}`,
    },
    earnings: {
      basicSalary: Number(payslip.basicSalary),
      overtime: Number(payslip.overtime),
      allowances: Number(payslip.allowances),
      bonuses: Number(payslip.bonuses),
      otherEarnings: Number(payslip.otherEarnings),
      gross: Number(payslip.grossEarnings),
    },
    deductions: {
      uifEmployee: Number(payslip.uifEmployee),
      paye: Number(payslip.paye),
      otherDeductions: Number(payslip.otherDeductions),
      total: Number(payslip.totalDeductions),
    },
    uifEmployer: Number(payslip.uifEmployer),
    netPay: Number(payslip.netPay),
    notes: payslip.notes,
  };
}

export async function createPayslip(
  userId: string,
  input: PayslipInput,
  ctx: Ctx = {},
): Promise<string> {
  const employee = await getEmployee(userId, input.employeeId); // ownership + not deleted

  const month = Number(input.periodMonth);
  const year = Number(input.periodYear);

  const duplicate = await prisma.payslip.findUnique({
    where: {
      employeeId_periodYear_periodMonth: {
        employeeId: employee.id,
        periodYear: year,
        periodMonth: month,
      },
    },
  });
  if (duplicate) {
    throw new PayslipError(
      "DUPLICATE",
      `A payslip for ${monthLabel(month)} ${year} already exists for this employee.`,
    );
  }

  const allowance = await getPayslipAllowance(userId);
  if (!allowance.canAdd) {
    throw new PayslipError(
      "PLAN_LIMIT",
      `Your ${allowance.limit === 1 ? "free trial" : "current plan"} allows ${allowance.limit} payslip${allowance.limit === 1 ? "" : "s"}. Upgrade for unlimited payslips.`,
    );
  }

  const calc = calculatePayslip({
    earnings: {
      basicSalary: toAmount(input.basicSalary),
      overtime: toAmount(input.overtime),
      allowances: toAmount(input.allowances),
      bonuses: toAmount(input.bonuses),
      otherEarnings: toAmount(input.otherEarnings),
    },
    deductions: { otherDeductions: toAmount(input.otherDeductions) },
    applyUif: input.applyUif,
    applyPaye: input.applyPaye,
  });

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const payDate = new Date(input.payDate);

  const payslip = await prisma.payslip.create({
    data: {
      userId,
      employeeId: employee.id,
      payslipNumber: payslipNumber(year, month),
      status: "FINALIZED",
      periodMonth: month,
      periodYear: year,
      periodStart,
      periodEnd,
      payDate,
      basicSalary: toAmount(input.basicSalary),
      overtime: toAmount(input.overtime),
      allowances: toAmount(input.allowances),
      bonuses: toAmount(input.bonuses),
      otherEarnings: toAmount(input.otherEarnings),
      grossEarnings: calc.grossEarnings,
      uifEmployee: calc.uifEmployee,
      paye: calc.paye,
      otherDeductions: calc.otherDeductions,
      totalDeductions: calc.totalDeductions,
      uifEmployer: calc.uifEmployer,
      netPay: calc.netPay,
      notes: input.notes?.trim() || null,
    },
  });

  // Render once for the vault document (size + checksum).
  const [profile, user] = await Promise.all([
    prisma.employerProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  const pdfBytes = await renderPayslipPdf(buildPdfInput(payslip, employee, profile, user));
  const checksum = createHash("sha256").update(pdfBytes).digest("hex");
  const employeeName = `${employee.firstName} ${employee.lastName}`;

  await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        userId,
        employeeId: employee.id,
        type: "PAYSLIP",
        title: `Payslip — ${employeeName} — ${monthLabel(month)} ${year}`,
        fileName: `${payslip.payslipNumber}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: pdfBytes.byteLength,
        storageKey: `generated:payslip:${payslip.id}`,
        checksum,
        tags: ["payslip", `${year}`],
        searchText: `${employeeName} payslip ${monthLabel(month)} ${year} ${payslip.payslipNumber}`,
      },
    });
    await tx.payslip.update({ where: { id: payslip.id }, data: { documentId: document.id } });

    await recordAudit({
      tx,
      action: "CREATE",
      entityType: "Payslip",
      entityId: payslip.id,
      actorId: userId,
      description: `Generated payslip ${payslip.payslipNumber} for ${employeeName}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  });

  return payslip.id;
}

export function listPayslips(userId: string) {
  return prisma.payslip.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    include: { employee: { select: { firstName: true, lastName: true, occupation: true, otherOccupation: true } } },
  });
}

export async function getPayslipView(userId: string, id: string) {
  const payslip = await prisma.payslip.findFirst({
    where: { id, userId, deletedAt: null },
    include: { employee: true },
  });
  if (!payslip) throw new PayslipError("NOT_FOUND", "Payslip not found.");
  return payslip;
}

/** Load an owned payslip and assemble its PDF input. */
export async function getPayslipPdfInput(userId: string, id: string): Promise<PayslipPdfInput> {
  const payslip = await prisma.payslip.findFirst({
    where: { id, userId, deletedAt: null },
    include: { employee: true },
  });
  if (!payslip) throw new PayslipError("NOT_FOUND", "Payslip not found.");

  const [profile, user] = await Promise.all([
    prisma.employerProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  return buildPdfInput(payslip, payslip.employee, profile, user);
}

/** Render an owned payslip to PDF bytes. */
export async function renderPayslipBytes(userId: string, id: string): Promise<{ bytes: Uint8Array; fileName: string }> {
  const input = await getPayslipPdfInput(userId, id);
  const bytes = await renderPayslipPdf(input);
  return { bytes, fileName: `${input.payslipNumber}.pdf` };
}

export async function markPayslipDelivered(
  userId: string,
  id: string,
  channel: "email" | "whatsapp",
): Promise<void> {
  await prisma.payslip.updateMany({
    where: { id, userId },
    data: channel === "email" ? { emailSentAt: new Date() } : { whatsappSentAt: new Date() },
  });
}

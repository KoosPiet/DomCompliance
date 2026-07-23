import { createHash } from "node:crypto";
import { customAlphabet } from "nanoid";
import type { EmploymentContract, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { getEmployee, decryptEmployeePii } from "@/server/services/employee";
import { occupationLabel } from "@/lib/validations/employee";
import {
  buildContractTerms,
  type ContractTerms,
} from "@/domain/contract/terms";
import { renderContractPdf, type ContractPdfInput } from "@/lib/pdf/contract-pdf";
import type { SignContractInput } from "@/lib/validations/contract";

export class ContractError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "ALREADY_SIGNED",
    message: string,
  ) {
    super(message);
    this.name = "ContractError";
  }
}

interface Ctx {
  ip?: string;
  userAgent?: string;
}

const contractSuffix = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 5);

function contractNumber(date: Date): string {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `LM-C-${stamp}-${contractSuffix()}`;
}

function joinAddress(...parts: (string | null | undefined)[]): string | null {
  const value = parts.filter(Boolean).join(", ");
  return value || null;
}

/** Generate a contract (in PENDING_SIGNATURE state) from an employee's record. */
export async function generateContract(
  userId: string,
  employeeId: string,
  ctx: Ctx = {},
): Promise<string> {
  const employee = await getEmployee(userId, employeeId); // throws if not owned
  const pii = decryptEmployeePii(employee);

  const [profile, user] = await Promise.all([
    prisma.employerProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const terms = buildContractTerms({
    employer: {
      name: profile?.employerName ?? user?.name ?? "The Employer",
      address: joinAddress(
        profile?.addressLine1,
        profile?.addressLine2,
        profile?.city,
        profile?.province,
        profile?.postalCode,
      ),
      phone: profile?.phone ?? user?.phone ?? null,
      email: user?.email ?? null,
    },
    employee: {
      fullName: `${employee.firstName} ${employee.lastName}`,
      idOrPassport: pii.idNumber ?? pii.passportNumber ?? pii.workPermitNumber ?? null,
      address: joinAddress(
        employee.addressLine1,
        employee.addressLine2,
        employee.city,
        employee.province,
        employee.postalCode,
      ),
      occupationLabel: occupationLabel(employee.occupation, employee.otherOccupation),
    },
    effectiveDate: employee.startDate,
    salary: Number(employee.salary),
    payFrequency: employee.payFrequency,
    workingDaysPerWeek: employee.workingDaysPerWeek,
    ordinaryHoursDay: Number(employee.ordinaryHoursDay),
    scheduleNote: employee.scheduleNote,
  });

  const contract = await prisma.employmentContract.create({
    data: {
      userId,
      employeeId,
      contractNumber: contractNumber(new Date()),
      status: "PENDING_SIGNATURE",
      effectiveDate: employee.startDate,
      salary: employee.salary,
      payFrequency: employee.payFrequency,
      ordinaryHoursWeek: terms.ordinaryHoursWeek.toString(),
      workingDaysPerWeek: terms.workingDaysPerWeek,
      annualLeaveDays: terms.annualLeaveDays,
      sickLeaveDays: terms.sickLeaveDays,
      noticePeriodDays: terms.noticePeriodDays,
      probationMonths: terms.probationMonths,
      includeUif: terms.includeUif,
      includePopia: terms.includePopia,
      terms: terms as unknown as Prisma.InputJsonValue,
    },
  });

  await recordAudit({
    action: "CREATE",
    entityType: "EmploymentContract",
    entityId: contract.id,
    actorId: userId,
    description: `Generated contract ${contract.contractNumber}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return contract.id;
}

export interface ContractView {
  contract: EmploymentContract;
  terms: ContractTerms;
  employeeName: string;
}

export async function getContractView(userId: string, id: string): Promise<ContractView> {
  const contract = await prisma.employmentContract.findFirst({
    where: { id, userId, deletedAt: null },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });
  if (!contract) throw new ContractError("NOT_FOUND", "Contract not found.");

  return {
    contract,
    terms: contract.terms as unknown as ContractTerms,
    employeeName: `${contract.employee.firstName} ${contract.employee.lastName}`,
  };
}

/** Assemble the input needed to (re)render a contract PDF. */
export function toPdfInput(contract: EmploymentContract): ContractPdfInput {
  const terms = contract.terms as unknown as ContractTerms;
  const generatedAtIso = (contract.employerSignedAt ?? contract.createdAt).toISOString();

  return {
    terms,
    contractNumber: contract.contractNumber,
    generatedAtIso,
    signatures: {
      employer: contract.employerSignedAt
        ? {
            name: contract.employerSignatureName ?? terms.employer.name,
            signedAtIso: contract.employerSignedAt.toISOString(),
            dataUrl: contract.employerSignatureData,
          }
        : null,
      employee: contract.employeeSignedAt
        ? {
            name: contract.employeeSignatureName ?? terms.employee.fullName,
            signedAtIso: contract.employeeSignedAt.toISOString(),
            dataUrl: contract.employeeSignatureData,
          }
        : null,
    },
  };
}

/** Load an owned contract or throw NOT_FOUND (used by the PDF route). */
export async function getContractForPdf(userId: string, id: string): Promise<EmploymentContract> {
  const contract = await prisma.employmentContract.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!contract) throw new ContractError("NOT_FOUND", "Contract not found.");
  return contract;
}

/**
 * Apply the employer's digital signature, mark the contract SIGNED, and create
 * (or refresh) the corresponding Document Vault entry.
 */
export async function signContract(
  userId: string,
  id: string,
  input: SignContractInput,
  ctx: Ctx = {},
): Promise<void> {
  const existing = await prisma.employmentContract.findFirst({
    where: { id, userId, deletedAt: null },
    include: { employee: { select: { firstName: true, lastName: true, occupation: true } } },
  });
  if (!existing) throw new ContractError("NOT_FOUND", "Contract not found.");
  if (existing.status === "SIGNED") {
    throw new ContractError("ALREADY_SIGNED", "This contract is already signed.");
  }

  const signedAt = new Date();

  // Render once to record accurate size + checksum for the vault entry.
  const signedContract: EmploymentContract = {
    ...existing,
    status: "SIGNED",
    employerSignatureName: input.signatureName,
    employerSignatureData: input.signatureData,
    employerSignedAt: signedAt,
    signatureIpAddress: ctx.ip ?? null,
  };
  const pdfBytes = await renderContractPdf(toPdfInput(signedContract));
  const checksum = createHash("sha256").update(pdfBytes).digest("hex");

  const employeeName = `${existing.employee.firstName} ${existing.employee.lastName}`;

  await prisma.$transaction(async (tx) => {
    await tx.employmentContract.update({
      where: { id },
      data: {
        status: "SIGNED",
        employerSignatureName: input.signatureName,
        employerSignatureData: input.signatureData,
        employerSignedAt: signedAt,
        signatureIpAddress: ctx.ip ?? null,
      },
    });

    const documentData = {
      title: `Employment Contract — ${employeeName}`,
      fileName: `${existing.contractNumber}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: pdfBytes.byteLength,
      storageKey: `generated:contract:${existing.id}`,
      checksum,
      tags: ["contract", existing.employee.occupation.toLowerCase()],
      searchText: `${employeeName} employment contract ${existing.contractNumber}`,
    };

    if (existing.documentId) {
      await tx.document.update({ where: { id: existing.documentId }, data: documentData });
    } else {
      const document = await tx.document.create({
        data: {
          userId,
          employeeId: existing.employeeId,
          type: "CONTRACT",
          ...documentData,
        },
      });
      await tx.employmentContract.update({
        where: { id },
        data: { documentId: document.id },
      });
    }

    await recordAudit({
      tx,
      action: "SIGN",
      entityType: "EmploymentContract",
      entityId: id,
      actorId: userId,
      description: `Signed contract ${existing.contractNumber}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  });
}

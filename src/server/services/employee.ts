import type { Employee, Prisma, TerminationReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptPii, decryptPii, maskTail } from "@/lib/crypto/pii";
import { recordAudit } from "@/server/audit";
import type { EmployeeInput } from "@/lib/validations/employee";
import {
  terminationReasonLabel,
  type EndEmploymentInput,
} from "@/lib/validations/employment";

export class EmployeeError extends Error {
  constructor(
    public readonly code: "PLAN_LIMIT" | "NOT_FOUND" | "NOT_EMPLOYED",
    message: string,
  ) {
    super(message);
    this.name = "EmployeeError";
  }
}

/** True once employment has formally ended. */
export function hasLeft(employee: Pick<Employee, "status">): boolean {
  return employee.status === "TERMINATED";
}

/**
 * Guard for anything that creates *new* employment records — payslips and
 * contracts. Once someone has left, the historical record stays readable and
 * downloadable, but nothing new may be issued in their name.
 */
export function assertStillEmployed(
  employee: Pick<Employee, "status" | "firstName" | "lastName">,
  action: string,
): void {
  if (hasLeft(employee)) {
    throw new EmployeeError(
      "NOT_EMPLOYED",
      `${employee.firstName} ${employee.lastName} no longer works for you, so you can't ${action}. Reinstate them first if this was a mistake.`,
    );
  }
}

interface Ctx {
  ip?: string;
  userAgent?: string;
}

const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** Map validated form input to Prisma persistence data (PII encrypted). */
function toPersistenceData(input: EmployeeInput): Prisma.EmployeeCreateWithoutUserInput {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    idNumber: encryptPii(clean(input.idNumber)),
    passportNumber: encryptPii(clean(input.passportNumber)),
    workPermitNumber: encryptPii(clean(input.workPermitNumber)),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    email: input.email ? input.email.trim().toLowerCase() : null,
    addressLine1: clean(input.addressLine1),
    addressLine2: clean(input.addressLine2),
    city: clean(input.city),
    province: clean(input.province),
    postalCode: clean(input.postalCode),
    occupation: input.occupation,
    otherOccupation: clean(input.otherOccupation),
    startDate: new Date(input.startDate),
    salary: input.salary,
    payFrequency: input.payFrequency,
    workingDaysPerWeek: Number.parseInt(input.workingDaysPerWeek, 10),
    ordinaryHoursDay: input.ordinaryHoursDay,
    scheduleNote: clean(input.scheduleNote),
    bankName: clean(input.bankName),
    bankAccountHolder: clean(input.bankAccountHolder),
    bankAccountNumber: encryptPii(clean(input.bankAccountNumber)),
    bankBranchCode: clean(input.bankBranchCode),
    bankAccountType: clean(input.bankAccountType),
    emergencyName: clean(input.emergencyName),
    emergencyPhone: clean(input.emergencyPhone),
    emergencyRelationship: clean(input.emergencyRelationship),
    notes: clean(input.notes),
  };
}

export interface EmployeeAllowance {
  used: number;
  limit: number | null; // null = unlimited
  canAdd: boolean;
}

/** How many employees the account may hold, and whether another can be added. */
export async function getEmployeeAllowance(userId: string): Promise<EmployeeAllowance> {
  const [subscription, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.employee.count({ where: { userId, deletedAt: null } }),
  ]);
  const limit = subscription?.employeeLimit ?? null;
  return { used, limit, canAdd: limit === null || used < limit };
}

export function listEmployees(userId: string) {
  return prisma.employee.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ status: "asc" }, { firstName: "asc" }],
    include: {
      // Filtered counts: soft-deleted records must not inflate the numbers
      // shown on the employee cards.
      _count: {
        select: {
          contracts: { where: { deletedAt: null } },
          payslips: { where: { deletedAt: null } },
          documents: { where: { deletedAt: null } },
        },
      },
    },
  });
}

/** Fetch one owned employee or throw NOT_FOUND. */
export async function getEmployee(userId: string, id: string): Promise<Employee> {
  const employee = await prisma.employee.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!employee) throw new EmployeeError("NOT_FOUND", "Employee not found.");
  return employee;
}

export interface DecryptedPii {
  idNumber: string | null;
  passportNumber: string | null;
  workPermitNumber: string | null;
  bankAccountNumber: string | null;
  bankAccountMasked: string;
}

/** Decrypt the sensitive fields for display to the owning employer. */
export function decryptEmployeePii(employee: Employee): DecryptedPii {
  const bankAccountNumber = decryptPii(employee.bankAccountNumber);
  return {
    idNumber: decryptPii(employee.idNumber),
    passportNumber: decryptPii(employee.passportNumber),
    workPermitNumber: decryptPii(employee.workPermitNumber),
    bankAccountNumber,
    bankAccountMasked: maskTail(bankAccountNumber),
  };
}

/** Build react-hook-form default values (decrypted) for the edit form. */
export function toFormValues(employee: Employee): EmployeeInput {
  const pii = decryptEmployeePii(employee);
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    idNumber: pii.idNumber ?? "",
    passportNumber: pii.passportNumber ?? "",
    workPermitNumber: pii.workPermitNumber ?? "",
    phone: employee.phone ?? "",
    whatsapp: employee.whatsapp ?? "",
    email: employee.email ?? "",
    addressLine1: employee.addressLine1 ?? "",
    addressLine2: employee.addressLine2 ?? "",
    city: employee.city ?? "",
    province: (employee.province ?? "") as EmployeeInput["province"],
    postalCode: employee.postalCode ?? "",
    occupation: employee.occupation,
    otherOccupation: employee.otherOccupation ?? "",
    startDate: employee.startDate.toISOString().slice(0, 10),
    salary: employee.salary.toString(),
    payFrequency: employee.payFrequency,
    workingDaysPerWeek: String(employee.workingDaysPerWeek) as EmployeeInput["workingDaysPerWeek"],
    ordinaryHoursDay: employee.ordinaryHoursDay.toString(),
    scheduleNote: employee.scheduleNote ?? "",
    bankName: employee.bankName ?? "",
    bankAccountHolder: employee.bankAccountHolder ?? "",
    bankAccountNumber: pii.bankAccountNumber ?? "",
    bankBranchCode: employee.bankBranchCode ?? "",
    bankAccountType: employee.bankAccountType ?? "",
    emergencyName: employee.emergencyName ?? "",
    emergencyPhone: employee.emergencyPhone ?? "",
    emergencyRelationship: employee.emergencyRelationship ?? "",
    notes: employee.notes ?? "",
  };
}

export async function createEmployee(
  userId: string,
  input: EmployeeInput,
  ctx: Ctx = {},
): Promise<string> {
  const allowance = await getEmployeeAllowance(userId);
  if (!allowance.canAdd) {
    throw new EmployeeError(
      "PLAN_LIMIT",
      `Your ${allowance.limit === 1 ? "free trial" : "current plan"} allows ${allowance.limit} employee${allowance.limit === 1 ? "" : "s"}. Upgrade to add more.`,
    );
  }

  const employee = await prisma.employee.create({
    data: { ...toPersistenceData(input), user: { connect: { id: userId } } },
  });

  await recordAudit({
    action: "CREATE",
    entityType: "Employee",
    entityId: employee.id,
    actorId: userId,
    description: `Added employee ${employee.firstName} ${employee.lastName}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return employee.id;
}

export async function updateEmployee(
  userId: string,
  id: string,
  input: EmployeeInput,
  ctx: Ctx = {},
): Promise<void> {
  await getEmployee(userId, id); // ownership check

  await prisma.employee.update({
    where: { id },
    data: toPersistenceData(input),
  });

  await recordAudit({
    action: "UPDATE",
    entityType: "Employee",
    entityId: id,
    actorId: userId,
    description: `Updated employee ${input.firstName} ${input.lastName}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * End employment: records the reason and last working day, and flips the
 * employee to TERMINATED — which blocks new payslips and contracts. Existing
 * records are deliberately left intact; an employer must keep them for three
 * years under the BCEA.
 */
export async function endEmployment(
  userId: string,
  id: string,
  input: EndEmploymentInput,
  ctx: Ctx = {},
): Promise<void> {
  const employee = await getEmployee(userId, id);

  await prisma.employee.update({
    where: { id },
    data: {
      status: "TERMINATED",
      endDate: new Date(input.endDate),
      terminationReason: input.reason as TerminationReason,
      terminationNote: clean(input.note),
    },
  });

  await recordAudit({
    action: "UPDATE",
    entityType: "Employee",
    entityId: id,
    actorId: userId,
    description: `Ended employment for ${employee.firstName} ${employee.lastName} — ${terminationReasonLabel(input.reason)}`,
    before: { status: employee.status, endDate: employee.endDate?.toISOString() ?? null },
    after: {
      status: "TERMINATED",
      endDate: input.endDate,
      reason: input.reason,
      note: input.note ?? null,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/** Undo an end-of-employment (e.g. logged in error, or they came back). */
export async function reinstateEmployee(
  userId: string,
  id: string,
  ctx: Ctx = {},
): Promise<void> {
  const employee = await getEmployee(userId, id);

  await prisma.employee.update({
    where: { id },
    data: {
      status: "ACTIVE",
      endDate: null,
      terminationReason: null,
      terminationNote: null,
    },
  });

  await recordAudit({
    action: "RESTORE",
    entityType: "Employee",
    entityId: id,
    actorId: userId,
    description: `Reinstated ${employee.firstName} ${employee.lastName} as an active employee`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function softDeleteEmployee(
  userId: string,
  id: string,
  ctx: Ctx = {},
): Promise<void> {
  const employee = await getEmployee(userId, id);

  await prisma.employee.update({
    where: { id },
    data: { deletedAt: new Date(), status: "TERMINATED" },
  });

  await recordAudit({
    action: "DELETE",
    entityType: "Employee",
    entityId: id,
    actorId: userId,
    description: `Removed employee ${employee.firstName} ${employee.lastName}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

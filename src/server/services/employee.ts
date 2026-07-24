import type { Employee, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptPii, decryptPii, maskTail } from "@/lib/crypto/pii";
import { recordAudit } from "@/server/audit";
import type { EmployeeInput } from "@/lib/validations/employee";

export class EmployeeError extends Error {
  constructor(
    public readonly code: "PLAN_LIMIT" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "EmployeeError";
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

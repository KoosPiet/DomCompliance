/**
 * Database seed. Idempotent — safe to run multiple times.
 *
 * Creates:
 *   • A platform admin account.
 *   • A demo employer (Premium) with a profile, one employee, a compliance
 *     assessment and a leave balance — enough to explore the app.
 *
 * Run with:  npm run db:seed   (loads .env via `prisma db seed`)
 *
 * Self-contained (no `@/` imports) so it runs cleanly under tsx. The PII
 * encryption below mirrors src/lib/crypto/pii.ts so seeded values decrypt
 * correctly inside the app.
 */
import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { addDays, addMonths } from "date-fns";

const prisma = new PrismaClient();

// --- PII encryption (mirrors src/lib/crypto/pii.ts) -------------------------
function resolveKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? "";
  for (const enc of ["base64", "hex"] as const) {
    const buf = Buffer.from(raw, enc);
    if (buf.length === 32) return buf;
  }
  return createHash("sha256").update(raw).digest();
}
function encryptPii(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", resolveKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

async function main() {
  const adminPassword = await bcrypt.hash("Admin1234", 12);
  const demoPassword = await bcrypt.hash("Demo1234", 12);

  // --- Admin ---------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@labourmate.co.za" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@labourmate.co.za",
      name: "LabourMate Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✓ Admin: ${admin.email} (password: Admin1234)`);

  // --- Demo employer -------------------------------------------------------
  const demo = await prisma.user.upsert({
    where: { email: "demo@labourmate.co.za" },
    update: {},
    create: {
      email: "demo@labourmate.co.za",
      name: "Thandi Mokoena",
      passwordHash: demoPassword,
      role: "OWNER",
      emailVerified: new Date(),
      phone: "082 123 4567",
      employerProfile: {
        create: {
          employerName: "Thandi Mokoena",
          phone: "082 123 4567",
          addressLine1: "12 Acacia Road",
          city: "Johannesburg",
          province: "Gauteng",
          postalCode: "2196",
          onboardingCompletedAt: new Date(),
        },
      },
      subscription: {
        create: {
          plan: "PREMIUM_MONTHLY",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: addMonths(new Date(), 1),
          priceZarCents: 4900,
          employeeLimit: null,
          payslipLimit: null,
        },
      },
    },
  });
  console.log(`✓ Demo employer: ${demo.email} (password: Demo1234)`);

  // --- Demo employee (idempotent) -----------------------------------------
  const existingEmployee = await prisma.employee.findFirst({
    where: { userId: demo.id, deletedAt: null },
  });

  if (!existingEmployee) {
    const startDate = addMonths(new Date(), -8);
    const employee = await prisma.employee.create({
      data: {
        userId: demo.id,
        firstName: "Grace",
        lastName: "Ndlovu",
        idNumber: encryptPii("9001010001088"),
        phone: "073 555 1234",
        whatsapp: "073 555 1234",
        occupation: "DOMESTIC_WORKER",
        status: "ACTIVE",
        startDate,
        salary: "4500.00",
        payFrequency: "MONTHLY",
        workingDaysPerWeek: 5,
        ordinaryHoursDay: "9",
        scheduleNote: "Mon–Fri 08:00–17:00",
        bankName: "Capitec",
        bankAccountHolder: "G Ndlovu",
        bankAccountNumber: encryptPii("1234567890"),
        bankBranchCode: "470010",
        emergencyName: "Sipho Ndlovu",
        emergencyPhone: "073 555 9999",
        emergencyRelationship: "Brother",
        leaveBalances: {
          create: {
            leaveType: "ANNUAL",
            cycleStart: startDate,
            cycleEnd: addDays(startDate, 365),
            entitledDays: "15",
            accruedDays: "10",
            takenDays: "3",
            balanceDays: "7",
          },
        },
      },
    });
    console.log(`✓ Demo employee: ${employee.firstName} ${employee.lastName}`);
  } else {
    console.log("✓ Demo employee already present — skipping");
  }

  // --- Compliance assessment ----------------------------------------------
  const hasAssessment = await prisma.complianceAssessment.findFirst({
    where: { userId: demo.id },
  });
  if (!hasAssessment) {
    await prisma.complianceAssessment.create({
      data: {
        userId: demo.id,
        source: "DASHBOARD",
        score: 71,
        rating: "ORANGE",
        riskFlags: ["submitsUif"],
        answers: {
          employsWorker: true,
          hasContract: true,
          issuesPayslips: true,
          registeredUif: true,
          submitsUif: false,
          keepsLeaveRecords: true,
          keepsSalaryRecords: true,
          hasSignedDocuments: true,
        },
      },
    });
    console.log("✓ Demo compliance assessment (71%)");
  }

  console.log("\nSeed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

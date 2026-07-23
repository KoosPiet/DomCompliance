-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE_TRIAL', 'PREMIUM_MONTHLY', 'PREMIUM_ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Occupation" AS ENUM ('DOMESTIC_WORKER', 'GARDENER', 'NANNY', 'CAREGIVER', 'DRIVER', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('MONTHLY', 'FORTNIGHTLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'FAMILY_RESPONSIBILITY', 'MATERNITY', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "LeaveLedgerType" AS ENUM ('ACCRUAL', 'TAKEN', 'ADJUSTMENT', 'RESET');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'PAYSLIP', 'WARNING', 'PERFORMANCE_REVIEW', 'ID_DOCUMENT', 'BANK_DETAILS', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('GENERATE_PAYSLIP', 'PAY_SALARY', 'SUBMIT_UIF', 'SALARY_REVIEW', 'CONTRACT_RENEWAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('ONCE', 'MONTHLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('NETCASH');

-- CreateEnum
CREATE TYPE "ComplianceRating" AS ENUM ('RED', 'ORANGE', 'GREEN');

-- CreateEnum
CREATE TYPE "ComplianceSource" AS ENUM ('LANDING', 'VIRAL', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SIGN', 'SEND', 'PAYMENT');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employerName" TEXT NOT NULL,
    "idNumber" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "alternateEmail" TEXT,
    "uifReferenceNumber" TEXT,
    "sarsReference" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idNumber" TEXT,
    "passportNumber" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "occupation" "Occupation" NOT NULL,
    "otherOccupation" TEXT,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "salary" DECIMAL(12,2) NOT NULL,
    "payFrequency" "PayFrequency" NOT NULL DEFAULT 'MONTHLY',
    "workingDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "ordinaryHoursDay" DECIMAL(4,2) NOT NULL DEFAULT 9,
    "scheduleNote" TEXT,
    "bankName" TEXT,
    "bankAccountHolder" TEXT,
    "bankAccountNumber" TEXT,
    "bankBranchCode" TEXT,
    "bankAccountType" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelationship" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "salary" DECIMAL(12,2) NOT NULL,
    "payFrequency" "PayFrequency" NOT NULL,
    "ordinaryHoursWeek" DECIMAL(5,2) NOT NULL,
    "workingDaysPerWeek" INTEGER NOT NULL,
    "annualLeaveDays" INTEGER NOT NULL DEFAULT 15,
    "sickLeaveDays" INTEGER NOT NULL DEFAULT 30,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 28,
    "probationMonths" INTEGER NOT NULL DEFAULT 3,
    "includeUif" BOOLEAN NOT NULL DEFAULT true,
    "includePopia" BOOLEAN NOT NULL DEFAULT true,
    "terms" JSONB,
    "employerSignatureName" TEXT,
    "employerSignedAt" TIMESTAMP(3),
    "employerSignatureData" TEXT,
    "employeeSignatureName" TEXT,
    "employeeSignedAt" TIMESTAMP(3),
    "employeeSignatureData" TEXT,
    "signatureIpAddress" TEXT,
    "documentId" UUID,
    "pdfStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "payslipNumber" TEXT NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "overtime" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossEarnings" DECIMAL(12,2) NOT NULL,
    "uifEmployee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paye" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "uifEmployer" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "documentId" UUID,
    "pdfStorageKey" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "entitledDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "accruedDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "takenDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "balanceDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'APPROVED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(6,2) NOT NULL,
    "reason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_ledger_entries" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "type" "LeaveLedgerType" NOT NULL,
    "days" DECIMAL(6,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "leaveRequestId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID,
    "type" "ReminderType" NOT NULL,
    "frequency" "ReminderFrequency" NOT NULL DEFAULT 'MONTHLY',
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "nextRunAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "channelEmail" BOOLEAN NOT NULL DEFAULT true,
    "channelWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE_TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "priceZarCents" INTEGER NOT NULL DEFAULT 0,
    "employeeLimit" INTEGER DEFAULT 1,
    "payslipLimit" INTEGER DEFAULT 1,
    "netcashAccountRef" TEXT,
    "netcashSubscriptionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subscriptionId" UUID,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "amountZarCents" INTEGER NOT NULL,
    "vatZarCents" INTEGER NOT NULL DEFAULT 0,
    "totalZarCents" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "pdfStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "invoiceId" UUID,
    "subscriptionId" UUID,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'NETCASH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "amountZarCents" INTEGER NOT NULL,
    "method" TEXT,
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_assessments" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "leadId" UUID,
    "source" "ComplianceSource" NOT NULL DEFAULT 'LANDING',
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" "ComplianceRating" NOT NULL,
    "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" "ComplianceSource" NOT NULL DEFAULT 'VIRAL',
    "complianceScore" INTEGER,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedUserId" UUID,
    "utm" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID,
    "reminderId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'QUEUED',
    "toNumber" TEXT NOT NULL,
    "templateName" TEXT,
    "body" TEXT,
    "mediaUrl" TEXT,
    "providerMessageId" TEXT,
    "payslipId" UUID,
    "documentId" UUID,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedToId" UUID,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorEmail" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_profiles_userId_key" ON "employer_profiles"("userId");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_userId_status_idx" ON "employees"("userId", "status");

-- CreateIndex
CREATE INDEX "employees_deletedAt_idx" ON "employees"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "employment_contracts_contractNumber_key" ON "employment_contracts"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employment_contracts_documentId_key" ON "employment_contracts"("documentId");

-- CreateIndex
CREATE INDEX "employment_contracts_userId_idx" ON "employment_contracts"("userId");

-- CreateIndex
CREATE INDEX "employment_contracts_employeeId_idx" ON "employment_contracts"("employeeId");

-- CreateIndex
CREATE INDEX "employment_contracts_status_idx" ON "employment_contracts"("status");

-- CreateIndex
CREATE INDEX "employment_contracts_deletedAt_idx" ON "employment_contracts"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payslipNumber_key" ON "payslips"("payslipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_documentId_key" ON "payslips"("documentId");

-- CreateIndex
CREATE INDEX "payslips_userId_idx" ON "payslips"("userId");

-- CreateIndex
CREATE INDEX "payslips_employeeId_idx" ON "payslips"("employeeId");

-- CreateIndex
CREATE INDEX "payslips_periodYear_periodMonth_idx" ON "payslips"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "payslips_deletedAt_idx" ON "payslips"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employeeId_periodYear_periodMonth_key" ON "payslips"("employeeId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "leave_balances_employeeId_idx" ON "leave_balances"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_leaveType_cycleStart_key" ON "leave_balances"("employeeId", "leaveType", "cycleStart");

-- CreateIndex
CREATE INDEX "leave_requests_userId_idx" ON "leave_requests"("userId");

-- CreateIndex
CREATE INDEX "leave_requests_employeeId_idx" ON "leave_requests"("employeeId");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_ledger_entries_employeeId_leaveType_idx" ON "leave_ledger_entries"("employeeId", "leaveType");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_employeeId_idx" ON "documents"("employeeId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

-- CreateIndex
CREATE INDEX "reminders_userId_idx" ON "reminders"("userId");

-- CreateIndex
CREATE INDEX "reminders_status_nextRunAt_idx" ON "reminders"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "reminders_deletedAt_idx" ON "reminders"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_providerReference_idx" ON "payments"("providerReference");

-- CreateIndex
CREATE INDEX "compliance_assessments_userId_idx" ON "compliance_assessments"("userId");

-- CreateIndex
CREATE INDEX "compliance_assessments_source_idx" ON "compliance_assessments"("source");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_converted_idx" ON "leads"("converted");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_messages_userId_idx" ON "whatsapp_messages"("userId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_providerMessageId_idx" ON "whatsapp_messages"("providerMessageId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_provider_processedAt_idx" ON "webhook_events"("provider", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_ledger_entries" ADD CONSTRAINT "leave_ledger_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_ledger_entries" ADD CONSTRAINT "leave_ledger_entries_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


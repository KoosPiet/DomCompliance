/**
 * Billing service — Netcash Pay Now subscription checkout + reconciliation.
 *
 * Checkout creates a PENDING payment and returns a reference. The Netcash
 * notification (ITN) is the single source of truth for activation: it is
 * idempotent (guarded by both the WebhookEvent table and the payment status)
 * so retries or duplicate postbacks never double-activate or double-invoice.
 */

import { addMonths, addYears } from "date-fns";
import { customAlphabet } from "nanoid";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { toCents } from "@/domain/money";
import { planById, type PlanId } from "@/config/site";
import { generatePaymentReference } from "@/lib/netcash/paynow";
import type { NetcashNotification } from "@/lib/netcash/paynow";

export class BillingError extends Error {
  constructor(
    public readonly code:
      | "INVALID_PLAN"
      | "USER_NOT_FOUND"
      | "NOT_CONFIGURED",
    message: string,
  ) {
    super(message);
    this.name = "BillingError";
  }
}

/** Plans a customer can actually pay for (the free trial is not payable). */
const PAYABLE_PLANS: PlanId[] = ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"];

const invoiceSuffix = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

function invoiceNumber(date: Date): string {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `INV-${stamp}-${invoiceSuffix()}`;
}

function periodEndFor(plan: PlanId, from: Date): Date {
  return plan === "PREMIUM_ANNUAL" ? addYears(from, 1) : addMonths(from, 1);
}

export interface CheckoutResult {
  paymentId: string;
  reference: string;
  amountZar: number;
  amountZarCents: number;
  description: string;
  planId: PlanId;
  planName: string;
  customer: { name: string | null; email: string };
}

/**
 * Create a pending payment for a premium plan and return the details needed to
 * build the Netcash Pay Now form. Does not mutate the subscription — that only
 * happens once Netcash confirms the payment.
 */
export async function createCheckout(
  userId: string,
  planId: PlanId,
): Promise<CheckoutResult> {
  if (!PAYABLE_PLANS.includes(planId)) {
    throw new BillingError("INVALID_PLAN", "That plan cannot be purchased.");
  }

  const plan = planById(planId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user || user.deletedAt) {
    throw new BillingError("USER_NOT_FOUND", "Account not found.");
  }

  const amountZarCents = toCents(plan.priceZar);
  const reference = generatePaymentReference();
  const description = `LabourMate ${plan.name}`.slice(0, 50);

  const payment = await prisma.payment.create({
    data: {
      userId,
      subscriptionId: user.subscription?.id ?? null,
      provider: "NETCASH",
      status: "PENDING",
      providerReference: reference,
      amountZarCents,
      rawPayload: { planId, plan: plan.name } as Prisma.InputJsonValue,
    },
  });

  return {
    paymentId: payment.id,
    reference,
    amountZar: plan.priceZar,
    amountZarCents,
    description,
    planId,
    planName: plan.name,
    customer: { name: user.name, email: user.email },
  };
}

export interface ReconcileContext {
  ip?: string;
  userAgent?: string;
  eventId: string;
}

export type ReconcileOutcome =
  | { status: "duplicate" }
  | { status: "unmatched"; reference: string }
  | { status: "declined"; paymentId: string }
  | { status: "activated"; paymentId: string; plan: PlanId };

/**
 * Apply a Netcash notification: mark the payment, and on success activate the
 * subscription and issue a paid invoice — all atomically and idempotently.
 */
export async function applyNetcashNotification(
  notification: NetcashNotification,
  ctx: ReconcileContext,
): Promise<ReconcileOutcome> {
  // 1. Idempotency: record the webhook event; bail if already processed.
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "netcash", eventId: ctx.eventId } },
  });
  if (existing?.processedAt) {
    return { status: "duplicate" };
  }
  if (!existing) {
    await prisma.webhookEvent.create({
      data: {
        provider: "netcash",
        eventId: ctx.eventId,
        type: notification.accepted ? "payment.accepted" : "payment.declined",
        payload: notification.raw as Prisma.InputJsonValue,
      },
    });
  }

  const markProcessed = (error?: string) =>
    prisma.webhookEvent.update({
      where: { provider_eventId: { provider: "netcash", eventId: ctx.eventId } },
      data: { processedAt: new Date(), error: error ?? null },
    });

  // 2. Match the payment by our reference.
  const payment = await prisma.payment.findFirst({
    where: { providerReference: notification.reference },
  });

  if (!payment) {
    await markProcessed(`No payment for reference ${notification.reference}`);
    return { status: "unmatched", reference: notification.reference };
  }

  // Already reconciled — nothing to do (idempotent).
  if (payment.status === "COMPLETED") {
    await markProcessed();
    return { status: "activated", paymentId: payment.id, plan: readPlan(payment.rawPayload) };
  }

  const planId = readPlan(payment.rawPayload);

  // 3a. Declined / failed.
  if (!notification.accepted) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        method: notification.method,
        processedAt: new Date(),
        rawPayload: notification.raw as Prisma.InputJsonValue,
      },
    });
    await recordAudit({
      action: "PAYMENT",
      entityType: "Payment",
      entityId: payment.id,
      actorId: payment.userId,
      description: `Netcash payment declined (${notification.reason || "no reason"})`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    await markProcessed();
    return { status: "declined", paymentId: payment.id };
  }

  // 3b. Accepted — activate subscription + issue invoice atomically.
  const plan = planById(planId);
  const now = new Date();
  const periodEnd = periodEndFor(planId, now);

  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        plan: planId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        priceZarCents: payment.amountZarCents,
        employeeLimit: null,
        payslipLimit: null,
        netcashAccountRef: notification.transactionId || null,
      },
      update: {
        plan: planId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        priceZarCents: payment.amountZarCents,
        employeeLimit: null,
        payslipLimit: null,
        netcashAccountRef: notification.transactionId || null,
      },
    });

    const invoice = await tx.invoice.create({
      data: {
        userId: payment.userId,
        subscriptionId: subscription.id,
        invoiceNumber: invoiceNumber(now),
        status: "PAID",
        amountZarCents: payment.amountZarCents,
        totalZarCents: payment.amountZarCents,
        periodStart: now,
        periodEnd,
        issuedAt: now,
        paidAt: now,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        method: notification.method,
        processedAt: now,
        rawPayload: notification.raw as Prisma.InputJsonValue,
      },
    });

    await recordAudit({
      tx,
      action: "PAYMENT",
      entityType: "Subscription",
      entityId: subscription.id,
      actorId: payment.userId,
      description: `Netcash payment accepted — activated ${plan.name}`,
      metadata: { reference: notification.reference, invoiceId: invoice.id },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  });

  await markProcessed();
  return { status: "activated", paymentId: payment.id, plan: planId };
}

/** Read the plan id stashed on the payment at checkout, with a safe default. */
function readPlan(rawPayload: Prisma.JsonValue | null): PlanId {
  if (rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)) {
    const value = (rawPayload as Record<string, unknown>).planId;
    if (value === "PREMIUM_MONTHLY" || value === "PREMIUM_ANNUAL") return value;
  }
  return "PREMIUM_MONTHLY";
}

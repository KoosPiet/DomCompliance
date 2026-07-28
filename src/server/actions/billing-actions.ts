"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import { getNetcashConfig } from "@/lib/netcash/config";
import { buildPayNowFields } from "@/lib/netcash/paynow";
import {
  cancelSubscriptionSchema,
  type CancelSubscriptionInput,
} from "@/lib/validations/billing";
import {
  createCheckout,
  cancelSubscription,
  resumeSubscription,
  BillingError,
} from "@/server/services/billing";
import type { PlanId } from "@/config/site";

export type CheckoutResponse =
  | { ok: true; action: string; fields: Record<string, string> }
  | { ok: false; error: string };

/**
 * Begin a Netcash Pay Now checkout for the signed-in user. Returns the target
 * URL and the hidden form fields; the client renders and submits the form,
 * navigating the browser to Netcash's hosted payment page.
 */
export async function startCheckoutAction(planId: PlanId): Promise<CheckoutResponse> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Please sign in to upgrade." };
  }

  const config = getNetcashConfig();
  if (!config.configured) {
    return {
      ok: false,
      error: "Payments are not available right now. Please try again shortly.",
    };
  }

  try {
    const checkout = await createCheckout(session.user.id, planId);

    const [firstName, ...rest] = (checkout.customer.name ?? "").trim().split(" ");

    const fields = buildPayNowFields(config, {
      amountZar: checkout.amountZar,
      reference: checkout.reference,
      description: checkout.description,
      email: checkout.customer.email,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      // Pass-through values returned in the notification (Extra1/2/3).
      extra1: checkout.paymentId,
      extra2: session.user.id,
      extra3: checkout.planId,
      // Recurring billing: Netcash collects each cycle and notifies us.
      subscription: checkout.subscription,
    });

    return { ok: true, action: config.payNowUrl, fields };
  } catch (error) {
    if (error instanceof BillingError) {
      return { ok: false, error: error.message };
    }
    console.error("[billing] Checkout failed:", error);
    return { ok: false, error: "Could not start checkout. Please try again." };
  }
}

export type BillingActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function cancelSubscriptionAction(
  input: CancelSubscriptionInput,
): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = cancelSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ctx = await getRequestContext();
  let endsAt: Date | null = null;
  try {
    ({ endsAt } = await cancelSubscription(session.user.id, parsed.data, ctx));
  } catch (e) {
    if (e instanceof BillingError) return { ok: false, message: e.message };
    throw e;
  }

  revalidatePath("/billing");
  return {
    ok: true,
    message: endsAt
      ? `Cancelled. You keep full access until ${endsAt.toLocaleDateString("en-ZA")}.`
      : "Your subscription has been cancelled.",
  };
}

export async function resumeSubscriptionAction(): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  await resumeSubscription(session.user.id, ctx);

  revalidatePath("/billing");
  return { ok: true, message: "Your subscription will continue as normal." };
}

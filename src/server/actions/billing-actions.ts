"use server";

import { auth } from "@/auth";
import { getNetcashConfig } from "@/lib/netcash/config";
import { buildPayNowFields } from "@/lib/netcash/paynow";
import { createCheckout, BillingError } from "@/server/services/billing";
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
    const returnBase = `/api/v1/payments/netcash/return`;
    const origin = config.urls.accept.replace(/\/payment\/success$/, "");

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
      acceptUrl: `${origin}${returnBase}?status=success&ref=${checkout.reference}`,
      redirectUrl: `${origin}${returnBase}?status=pending&ref=${checkout.reference}`,
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

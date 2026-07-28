/**
 * Netcash Pay Now form builder + notification parser.
 *
 * Field mapping per the Pay Now e-commerce specification:
 *   m1  service key             p2  unique reference (<= 25 chars)
 *   m2  software vendor key     p3  description (<= 50 chars)
 *   p4  amount in ZAR (2dp)     Budget  "Y" (compulsory)
 *   m4/m5/m6  pass-through extras, returned verbatim as Extra1/2/3
 *   m9  cardholder email        m11 cardholder mobile
 *   m14 request subscription token (0/1)
 *   m15 existing card token for subscription cards
 *   m16 subscription indicator (0/1)
 *   m17 number of cycles        m18 frequency code
 *   m19 start date CCYY-MM-DD   m20 recurring amount
 *
 * Accept / decline / notify / redirect URLs are NOT sent per transaction —
 * they are configured once as postback URLs on the Netcash Pay Now service.
 */

import { customAlphabet } from "nanoid";
import type { NetcashConfig } from "./config";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const refSuffix = customAlphabet(REF_ALPHABET, 6);

/**
 * Generate a unique, Netcash-safe payment reference (uppercase, <= 25 chars).
 * Example: "LM-LX9F2A-7KQD".
 */
export function generatePaymentReference(prefix = "LM"): string {
  const time = Date.now().toString(36).toUpperCase();
  return `${prefix}-${time}-${refSuffix()}`.slice(0, 25);
}

export interface PayNowSubscription {
  /** Netcash frequency code (m18): 1 monthly, 6 annually, etc. */
  frequency: number;
  /** Number of billing cycles (m17, max 3 digits). */
  cycles: number;
  /** First recurring charge, CCYY-MM-DD (m19). */
  startDate: string;
  /**
   * Recurring amount (m20). May differ from the initial payment — e.g. a
   * discounted or pro-rated first charge followed by the standard price.
   */
  recurringAmountZar: number;
}

export interface PayNowInput {
  amountZar: number;
  reference: string;
  /** Goods/description, truncated to Netcash's 50-char limit. */
  description: string;
  email?: string;
  cellNumber?: string;
  firstName?: string;
  lastName?: string;
  /** Pass-through values returned verbatim in the notification (Extra1/2/3). */
  extra1?: string;
  extra2?: string;
  extra3?: string;
  /** When set, Netcash sets up recurring billing for this transaction. */
  subscription?: PayNowSubscription;
  /** Reuse a stored card token instead of asking for card details again (m15). */
  cardToken?: string;
}

/** Format a date as Netcash's CCYY-MM-DD, in local (SA) terms. */
export function netcashDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Build the hidden form fields for a Netcash Pay Now POST. The caller renders
 * these as `<input type="hidden">` fields inside a form that targets
 * {@link NetcashConfig.payNowUrl} and submits it (top-level navigation).
 */
export function buildPayNowFields(
  config: NetcashConfig,
  input: PayNowInput,
): Record<string, string> {
  const fields: Record<string, string> = {
    m1: config.serviceKey,
    m2: config.softwareVendorKey,
    p2: input.reference,
    p3: input.description.slice(0, 50),
    p4: input.amountZar.toFixed(2),
    // Compulsory per the Pay Now specification.
    Budget: "Y",
    m4: input.extra1 ?? "",
    m5: input.extra2 ?? "",
    m6: input.extra3 ?? "",
  };

  if (input.email) fields.m9 = input.email;
  if (input.cellNumber) fields.m11 = input.cellNumber;

  if (input.subscription) {
    const { frequency, cycles, startDate, recurringAmountZar } = input.subscription;
    // Ask Netcash to return a card token so the card can be re-used later
    // (e.g. when the customer changes plan) without re-capturing details.
    fields.m14 = "1";
    fields.m16 = "1";
    fields.m17 = String(Math.min(999, Math.max(1, Math.trunc(cycles))));
    fields.m18 = String(frequency);
    fields.m19 = startDate;
    fields.m20 = recurringAmountZar.toFixed(2);
  } else {
    fields.m14 = "0";
    fields.m16 = "0";
  }

  // Charge an existing stored card rather than prompting for a new one.
  if (input.cardToken) fields.m15 = input.cardToken;

  return fields;
}

export interface NetcashNotification {
  /** Our reference (p2). */
  reference: string;
  /** Netcash transaction trace id, if provided. */
  transactionId: string;
  amount: number;
  accepted: boolean;
  reason: string;
  method?: string;
  extra1?: string;
  extra2?: string;
  extra3?: string;
  /** Stored-card token returned when m14=1 was requested. */
  cardToken?: string;
  raw: Record<string, string>;
}

/** Read the first non-empty value across a set of candidate field names. */
function pick(source: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

/**
 * Parse a Netcash Pay Now notification (ITN postback or return params).
 * Netcash uses inconsistent field names across integration types, so we probe
 * several candidates for each logical value — the same defensive approach the
 * TrailTime integration relies on.
 */
export function parseNetcashNotification(
  raw: Record<string, string>,
): NetcashNotification {
  const reference = pick(raw, "p2", "Reference", "reference", "RequestTrace");
  const transactionId = pick(raw, "RequestTrace", "TransactionId", "p6", "TransactionAcceptedId");

  const rawAmount = pick(raw, "p4", "Amount", "amount", "p5") || "0";
  let amount = Number.parseFloat(rawAmount);
  if (!Number.isFinite(amount)) amount = 0;
  // Some Netcash responses report cents for large integer amounts.
  if (amount > 100000 && !rawAmount.includes(".")) amount = amount / 100;

  const acceptedFlag = pick(raw, "TransactionAccepted", "Accepted").toLowerCase();
  const reason = pick(raw, "Reason", "reason", "Message");
  const accepted =
    acceptedFlag === "true" ||
    acceptedFlag === "1" ||
    reason.toLowerCase().includes("approved") ||
    reason.toLowerCase().includes("success");

  return {
    reference,
    transactionId,
    amount,
    accepted,
    reason,
    method: pick(raw, "Method", "method") || undefined,
    extra1: pick(raw, "Extra1", "m4", "extra1") || undefined,
    extra2: pick(raw, "Extra2", "m5", "extra2") || undefined,
    extra3: pick(raw, "Extra3", "m6", "extra3") || undefined,
    cardToken: pick(raw, "m15", "Token", "CardToken", "SubscriptionToken") || undefined,
    raw,
  };
}

/**
 * Netcash Pay Now form builder + notification parser.
 *
 * The field mapping mirrors the proven TrailTime integration so LabourMate
 * behaves identically against the shared merchant account:
 *   m1  service key            p2  unique reference (<= 25 chars)
 *   m2  software vendor key     p3  description (<= 50 chars)
 *   p4  amount in ZAR (2dp)     m4/m5/m6  pass-through extras (Extra1/2/3)
 *   m9  customer email          m10 accept (return) URL
 *   m11 customer cell           m14 redirect URL
 *   m15 customer name           Budget = "N"
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
  /** Per-transaction return URLs (default to the account-level config URLs). */
  acceptUrl?: string;
  redirectUrl?: string;
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
    Budget: "N",
    m4: input.extra1 ?? "",
    m5: input.extra2 ?? "",
    m6: input.extra3 ?? "",
    m10: input.acceptUrl ?? config.urls.accept,
    m14: input.redirectUrl ?? config.urls.redirect,
  };

  if (input.email) fields.m9 = input.email;
  if (input.cellNumber) fields.m11 = input.cellNumber;

  const name = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  if (name) fields.m15 = name;

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
    raw,
  };
}

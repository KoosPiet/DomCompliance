import { describe, it, expect } from "vitest";
import { getNetcashConfig } from "@/lib/netcash/config";
import {
  buildPayNowFields,
  generatePaymentReference,
  parseNetcashNotification,
} from "@/lib/netcash/paynow";

describe("Netcash Pay Now", () => {
  const config = getNetcashConfig();

  it("generates a prefixed reference within Netcash's 25-char limit", () => {
    const ref = generatePaymentReference();
    expect(ref.startsWith("LM-")).toBe(true);
    expect(ref.length).toBeLessThanOrEqual(25);
  });

  it("builds the mandatory Pay Now form fields", () => {
    const fields = buildPayNowFields(config, {
      amountZar: 49,
      reference: "LM-TEST",
      description: "LabourMate Premium Monthly",
      email: "a@b.com",
      extra1: "pay_1",
    });
    expect(fields.m1).toBe(config.serviceKey);
    expect(fields.m2).toBe(config.softwareVendorKey);
    expect(fields.p2).toBe("LM-TEST");
    expect(fields.p4).toBe("49.00"); // rands, 2dp — not cents
    expect(fields.Budget).toBe("Y"); // compulsory per the Pay Now spec
    expect(fields.m4).toBe("pay_1");
    expect(fields.m9).toBe("a@b.com");
  });

  it("does not send return URLs in the m-fields (they are account postbacks)", () => {
    const fields = buildPayNowFields(config, {
      amountZar: 49,
      reference: "LM-URL",
      description: "Once-off",
    });
    // m10/m14/m15 have defined meanings in the spec — a URL in any of them
    // would be misinterpreted (m14 expects 0/1, m15 expects a card token).
    expect(fields.m10).toBeUndefined();
    expect(fields.m14).toBe("0");
    expect(fields.m15).toBeUndefined();
    expect(fields.m16).toBe("0");
  });

  it("adds the recurring-billing fields for a subscription plan", () => {
    const fields = buildPayNowFields(config, {
      amountZar: 49,
      reference: "LM-SUB",
      description: "LabourMate Premium Monthly",
      subscription: {
        frequency: 1, // monthly
        cycles: 999,
        startDate: "2026-09-01",
        recurringAmountZar: 49,
      },
    });
    expect(fields.m14).toBe("1"); // request a reusable card token
    expect(fields.m16).toBe("1"); // subscription indicator
    expect(fields.m17).toBe("999");
    expect(fields.m18).toBe("1");
    expect(fields.m19).toBe("2026-09-01");
    expect(fields.m20).toBe("49.00");
  });

  it("clamps the cycle count to Netcash's 3-digit field", () => {
    const fields = buildPayNowFields(config, {
      amountZar: 49,
      reference: "LM-SUB2",
      description: "Sub",
      subscription: { frequency: 1, cycles: 5000, startDate: "2026-09-01", recurringAmountZar: 49 },
    });
    expect(fields.m17).toBe("999");
  });

  it("sends a stored card token when reusing a saved card", () => {
    const fields = buildPayNowFields(config, {
      amountZar: 49,
      reference: "LM-TOK",
      description: "Sub",
      cardToken: "11ad173c-9d3f-43b3-19se-as7b865e3099",
    });
    expect(fields.m15).toBe("11ad173c-9d3f-43b3-19se-as7b865e3099");
  });

  it("truncates the description to 50 characters", () => {
    const fields = buildPayNowFields(config, {
      amountZar: 10,
      reference: "LM-X",
      description: "x".repeat(80),
    });
    expect(fields.p3.length).toBe(50);
  });

  it("parses an accepted notification", () => {
    const n = parseNetcashNotification({
      TransactionAccepted: "true",
      p2: "LM-TEST",
      p4: "49.00",
      Reason: "Approved",
    });
    expect(n.accepted).toBe(true);
    expect(n.reference).toBe("LM-TEST");
    expect(n.amount).toBe(49);
  });

  it("parses a declined notification", () => {
    const n = parseNetcashNotification({
      TransactionAccepted: "false",
      p2: "LM-Y",
      Reason: "Declined",
    });
    expect(n.accepted).toBe(false);
    expect(n.reference).toBe("LM-Y");
  });
});

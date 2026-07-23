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
    expect(fields.Budget).toBe("N");
    expect(fields.m4).toBe("pay_1");
    expect(fields.m9).toBe("a@b.com");
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

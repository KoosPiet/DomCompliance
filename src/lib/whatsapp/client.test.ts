import { describe, it, expect } from "vitest";
import { normaliseZaPhone, waMeLink } from "@/lib/whatsapp/client";

describe("WhatsApp phone handling", () => {
  it("normalises SA numbers to E.164 digits", () => {
    expect(normaliseZaPhone("082 123 4567")).toBe("27821234567");
    expect(normaliseZaPhone("0821234567")).toBe("27821234567");
    expect(normaliseZaPhone("+27 82 123 4567")).toBe("27821234567");
    expect(normaliseZaPhone("27821234567")).toBe("27821234567");
    expect(normaliseZaPhone("821234567")).toBe("27821234567");
  });

  it("builds a wa.me link with a normalised number and encoded message", () => {
    const link = waMeLink("082 123 4567", "Hello Grace");
    expect(link).toContain("wa.me/27821234567");
    expect(link).toContain("Hello%20Grace");
  });
});

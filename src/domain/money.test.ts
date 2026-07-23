import { describe, it, expect } from "vitest";
import { roundZar, sumZar, toCents, fromCents, formatZar } from "@/domain/money";

describe("money", () => {
  it("rounds to cents (half-up)", () => {
    expect(roundZar(1.005)).toBe(1.01);
    expect(roundZar(2.344)).toBe(2.34);
    expect(roundZar(10)).toBe(10);
  });

  it("sums a list to cent precision", () => {
    expect(sumZar([1.1, 2.2, 3.3])).toBe(6.6);
    expect(sumZar([])).toBe(0);
  });

  it("converts rands <-> cents", () => {
    expect(toCents(49)).toBe(4900);
    expect(toCents(490)).toBe(49000);
    expect(fromCents(4900)).toBe(49);
    expect(fromCents(65)).toBe(0.65);
  });

  it("formats as ZAR currency", () => {
    const formatted = formatZar(1234.5);
    expect(formatted).toMatch(/R/);
    expect(formatted).toContain("234");
  });
});

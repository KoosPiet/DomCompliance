import { describe, it, expect } from "vitest";
import { encryptPii, decryptPii, maskTail, blindIndex, safeEqual } from "@/lib/crypto/pii";

describe("PII crypto", () => {
  it("round-trips plaintext through AES-256-GCM", () => {
    const cipher = encryptPii("9001015800086");
    expect(cipher).not.toBeNull();
    expect(cipher).not.toBe("9001015800086");
    expect(cipher?.startsWith("v1:")).toBe(true);
    expect(decryptPii(cipher)).toBe("9001015800086");
  });

  it("treats null / empty input as null", () => {
    expect(encryptPii(null)).toBeNull();
    expect(encryptPii("")).toBeNull();
    expect(encryptPii(undefined)).toBeNull();
    expect(decryptPii(null)).toBeNull();
  });

  it("produces a fresh ciphertext each time (random IV)", () => {
    expect(encryptPii("secret")).not.toBe(encryptPii("secret"));
  });

  it("masks all but the last digits", () => {
    expect(maskTail("1234567890")).toContain("7890");
    expect(maskTail(null)).toBe("");
  });

  it("blind-indexes case-insensitively and deterministically", () => {
    expect(blindIndex("ABC123")).toBe(blindIndex("abc123"));
    expect(blindIndex("ABC123")).not.toBe(blindIndex("XYZ"));
  });

  it("compares in constant time", () => {
    expect(safeEqual("token", "token")).toBe(true);
    expect(safeEqual("token", "other")).toBe(false);
    expect(safeEqual("a", "ab")).toBe(false);
  });
});

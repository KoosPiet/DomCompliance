/**
 * Money helpers. All monetary maths in the domain layer works in Rands as
 * plain numbers rounded to 2 decimals. Never use floats for storage — the
 * database stores Decimal(12,2); these helpers keep in-memory arithmetic
 * consistent with that precision.
 */

/** Round to 2 decimals (cents) using round-half-up, avoiding FP drift. */
export function roundZar(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Sum a list of Rand amounts, rounding the result to cents. */
export function sumZar(amounts: number[]): number {
  return roundZar(amounts.reduce((total, amount) => total + amount, 0));
}

const ZAR_FORMATTER = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a Rand amount as "R 1 234.56" (South African locale). */
export function formatZar(amount: number): string {
  return ZAR_FORMATTER.format(amount);
}

/** Convert Rands to integer cents (for storage of fixed prices). */
export function toCents(rands: number): number {
  return Math.round(rands * 100);
}

/** Convert integer cents back to Rands. */
export function fromCents(cents: number): number {
  return roundZar(cents / 100);
}

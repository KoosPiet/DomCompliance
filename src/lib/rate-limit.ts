/**
 * Lightweight fixed-window rate limiter.
 *
 * This in-memory implementation is per-process. It is correct for a single
 * instance and provides real protection in development and small deployments.
 * For horizontally-scaled/serverless production, swap the `store` for a
 * shared backend (e.g. Upstash Redis) implementing the same interface — the
 * call sites do not change.
 */

interface WindowState {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms timestamp when the window resets. */
  reset: number;
}

const store = new Map<string, WindowState>();

// Opportunistic cleanup so the map does not grow unbounded.
function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [key, state] of store) {
    if (state.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Max requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Consume one unit for `identifier`. Returns whether the request is allowed
 * plus metadata for standard `RateLimit-*` response headers.
 */
export function rateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    success: existing.count <= limit,
    limit,
    remaining,
    reset: existing.resetAt,
  };
}

/** Standard headers describing the current rate-limit state. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil((result.reset - Date.now()) / 1000)),
  };
}

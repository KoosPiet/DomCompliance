import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";

/**
 * Consistent JSON envelope + helpers for the versioned REST API.
 * Every route returns `{ ok: true, data }` or `{ ok: false, error }`.
 */

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

/** Common typed error responses. */
export const ApiErrors = {
  unauthorized: () => fail("UNAUTHORIZED", "Authentication required.", 401),
  forbidden: () => fail("FORBIDDEN", "You do not have access to this resource.", 403),
  notFound: (what = "Resource") => fail("NOT_FOUND", `${what} not found.`, 404),
  rateLimited: () =>
    fail("RATE_LIMITED", "Too many requests. Please slow down.", 429),
  conflict: (message: string) => fail("CONFLICT", message, 409),
  planLimit: (message: string) => fail("PLAN_LIMIT", message, 402),
  server: () =>
    fail("SERVER_ERROR", "Something went wrong. Please try again.", 500),
} as const;

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Throws {@link ApiValidationError} on failure so callers can respond 422.
 */
export class ApiValidationError extends Error {
  constructor(public readonly zodError: ZodError) {
    super("Validation failed");
    this.name = "ApiValidationError";
  }
}

export async function parseJson<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiValidationError(
      new ZodError([
        { code: "custom", path: [], message: "Invalid JSON body" },
      ]),
    );
  }

  const result = schema.safeParse(raw);
  if (!result.success) throw new ApiValidationError(result.error);
  return result.data;
}

/** Convert a thrown error into an appropriate API failure response. */
export function handleApiError(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ApiValidationError) {
    return fail(
      "VALIDATION_ERROR",
      "The submitted data was invalid.",
      422,
      error.zodError.flatten(),
    );
  }
  if (error instanceof ZodError) {
    return fail("VALIDATION_ERROR", "Invalid data.", 422, error.flatten());
  }

  console.error("[api] Unhandled error:", error);
  return ApiErrors.server();
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateCompliance } from "@/domain/compliance/scoring";
import { assessRequestSchema } from "@/lib/validations/compliance";
import { parseJson, handleApiError, ApiErrors, ok } from "@/lib/http";
import { getRequestContext } from "@/lib/request";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * POST /api/v1/compliance/assess
 *
 * Public, unauthenticated. Scores the compliance questionnaire, best-effort
 * persists the assessment (and a lead if an email is supplied) and returns the
 * result plus an `assessmentId` that can be attached to a subsequent signup.
 * Scoring never depends on the database, so results render even if
 * persistence is temporarily unavailable.
 */
export async function POST(request: Request) {
  try {
    const { ip, userAgent } = await getRequestContext();

    const limit = rateLimit(`compliance:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests." } },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }

    const body = await parseJson(request, assessRequestSchema);
    const result = evaluateCompliance(body.answers);
    const riskFlags = result.risks.map((r) => r.questionId);

    let assessmentId: string | null = null;

    try {
      let leadId: string | undefined;
      if (body.email) {
        const lead = await prisma.lead.create({
          data: {
            email: body.email.toLowerCase(),
            name: body.name,
            source: body.source,
            complianceScore: result.score,
            ipAddress: ip,
          },
        });
        leadId = lead.id;
      }

      const assessment = await prisma.complianceAssessment.create({
        data: {
          source: body.source,
          answers: body.answers,
          score: result.score,
          rating: result.rating,
          riskFlags,
          leadId,
          ipAddress: ip,
          userAgent,
        },
      });
      assessmentId = assessment.id;
    } catch (persistError) {
      // Non-fatal: return the score even if the DB is unreachable.
      console.error("[compliance] Failed to persist assessment:", persistError);
    }

    return ok(
      { assessmentId, result },
      { headers: rateLimitHeaders(limit) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export function GET() {
  return ApiErrors.notFound("Endpoint");
}

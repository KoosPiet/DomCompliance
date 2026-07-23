"use server";

import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { viralAnswersSchema, type ViralAnswersInput } from "@/lib/validations/compliance";
import { scoreViral } from "@/domain/compliance/viral";

export type ViralSubmitResult =
  | { ok: true; score: number; rating: "RED" | "ORANGE" | "GREEN"; assessmentId: string | null }
  | { ok: false };

/**
 * Public (no-auth) submission for the viral checker. Scores the answers and
 * records an anonymous ComplianceAssessment lead for analytics — scoring never
 * fails even if the write does.
 */
export async function submitViralCheckAction(
  input: ViralAnswersInput,
): Promise<ViralSubmitResult> {
  const parsed = viralAnswersSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const result = scoreViral(parsed.data);
  let assessmentId: string | null = null;

  try {
    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || null;
    const userAgent = h.get("user-agent") ?? null;
    const riskFlags = Object.entries(parsed.data)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    const assessment = await prisma.complianceAssessment.create({
      data: {
        source: "VIRAL",
        answers: parsed.data as Prisma.InputJsonValue,
        score: result.score,
        rating: result.rating,
        riskFlags,
        ipAddress: ip,
        userAgent,
      },
    });
    assessmentId = assessment.id;
  } catch (error) {
    console.error("[viral] Failed to persist assessment:", error);
  }

  return { ok: true, score: result.score, rating: result.rating, assessmentId };
}

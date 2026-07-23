"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { getRequestContext } from "@/lib/request";
import {
  employerProfileSchema,
  normaliseEmployerProfile,
  type EmployerProfileInput,
} from "@/lib/validations/employer";
import type { ActionResult } from "@/server/actions/auth-actions";

/**
 * Create or update the employer profile and mark onboarding complete, then
 * redirect to the dashboard.
 */
export async function saveEmployerProfile(
  input: EmployerProfileInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = employerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the form.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = normaliseEmployerProfile(parsed.data);
  const userId = session.user.id;

  await prisma.employerProfile.upsert({
    where: { userId },
    create: {
      userId,
      employerName: data.employerName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      alternateEmail: data.alternateEmail,
      onboardingCompletedAt: new Date(),
    },
    update: {
      employerName: data.employerName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      alternateEmail: data.alternateEmail,
      onboardingCompletedAt: new Date(),
    },
  });

  // Keep the primary phone on the user record in sync for convenience.
  await prisma.user.update({
    where: { id: userId },
    data: { phone: data.phone },
  });

  const ctx = await getRequestContext();
  await recordAudit({
    action: "UPDATE",
    entityType: "EmployerProfile",
    entityId: userId,
    actorId: userId,
    description: "Employer profile completed",
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  redirect("/dashboard");
}

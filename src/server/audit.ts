import type { Prisma, AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuditInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  actorId?: string | null;
  actorEmail?: string | null;
  description?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
  /** Optional transaction client to record the audit atomically. */
  tx?: Prisma.TransactionClient;
}

/**
 * Append an entry to the audit log. Auditing must never break the primary
 * operation, so failures are swallowed and logged (unless run inside a caller
 * transaction, where the caller controls atomicity).
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  const client = input.tx ?? prisma;
  const data = {
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId ?? undefined,
    actorEmail: input.actorEmail ?? undefined,
    description: input.description,
    before: input.before,
    after: input.after,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: input.metadata,
  };

  if (input.tx) {
    await client.auditLog.create({ data });
    return;
  }

  try {
    await client.auditLog.create({ data });
  } catch (error) {
    console.error("[audit] Failed to record audit entry:", error);
  }
}

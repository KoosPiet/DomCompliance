import { createHash, randomUUID } from "node:crypto";
import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/server/audit";
import { getEmployee } from "@/server/services/employee";
import {
  uploadObject,
  createSignedUrl,
  deleteObject,
  StorageError,
} from "@/lib/storage/supabase";

export class DocumentError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "NOT_FOUND" | "UPLOAD_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "DocumentError";
  }
}

interface Ctx {
  ip?: string;
  userAgent?: string;
}

function sanitizeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 80) || "file";
}

export interface UploadParams {
  title: string;
  type: DocumentType;
  employeeId?: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}

export async function uploadUserDocument(
  userId: string,
  params: UploadParams,
  ctx: Ctx = {},
): Promise<string> {
  if (params.employeeId) {
    await getEmployee(userId, params.employeeId); // ownership check (throws if not owned)
  }

  const safeName = sanitizeName(params.fileName);
  const key = `${userId}/${params.type.toLowerCase()}/${randomUUID()}-${safeName}`;

  try {
    await uploadObject({ key, bytes: params.bytes, contentType: params.mimeType });
  } catch (e) {
    if (e instanceof StorageError && e.code === "NOT_CONFIGURED") {
      throw new DocumentError("NOT_CONFIGURED", "File storage is not configured yet.");
    }
    throw new DocumentError("UPLOAD_FAILED", e instanceof Error ? e.message : "Upload failed.");
  }

  const checksum = createHash("sha256").update(params.bytes).digest("hex");

  const document = await prisma.document.create({
    data: {
      userId,
      employeeId: params.employeeId || null,
      type: params.type,
      title: params.title.trim(),
      fileName: safeName,
      mimeType: params.mimeType,
      sizeBytes: params.bytes.byteLength,
      storageKey: key,
      checksum,
      tags: [params.type.toLowerCase()],
      searchText: params.title.trim(),
    },
  });

  await recordAudit({
    action: "CREATE",
    entityType: "Document",
    entityId: document.id,
    actorId: userId,
    description: `Uploaded document “${document.title}”`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return document.id;
}

/**
 * Resolve how to serve a document: generated docs (contracts/payslips) redirect
 * to their on-demand PDF route; uploaded docs get a short-lived signed URL.
 */
export async function resolveDocumentDownload(
  userId: string,
  id: string,
): Promise<string> {
  const doc = await prisma.document.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!doc) throw new DocumentError("NOT_FOUND", "Document not found.");

  if (doc.storageKey.startsWith("generated:contract:")) {
    return `/contracts/${doc.storageKey.split(":")[2]}/pdf`;
  }
  if (doc.storageKey.startsWith("generated:payslip:")) {
    return `/payslips/${doc.storageKey.split(":")[2]}/pdf`;
  }

  try {
    return await createSignedUrl(doc.storageKey, 120);
  } catch {
    throw new DocumentError("NOT_CONFIGURED", "Could not generate a download link.");
  }
}

export interface DocumentMetaUpdate {
  title: string;
  type: DocumentType;
  employeeId?: string;
}

/**
 * Update an uploaded document's metadata (title, type, linked employee).
 * Generated documents (contracts/payslips) keep their type — their metadata is
 * derived from the source record, not editable here.
 */
export async function updateUserDocument(
  userId: string,
  id: string,
  meta: DocumentMetaUpdate,
  ctx: Ctx = {},
): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!doc) throw new DocumentError("NOT_FOUND", "Document not found.");
  if (doc.storageKey.startsWith("generated:")) {
    throw new DocumentError(
      "NOT_FOUND",
      "Generated contracts and payslips can't be re-classified.",
    );
  }

  let employeeId: string | null = null;
  if (meta.employeeId) {
    const employee = await getEmployee(userId, meta.employeeId); // ownership check
    employeeId = employee.id;
  }

  await prisma.document.update({
    where: { id },
    data: {
      title: meta.title.trim(),
      type: meta.type,
      employeeId,
      searchText: `${meta.title.trim()} ${doc.fileName}`,
    },
  });

  await recordAudit({
    action: "UPDATE",
    entityType: "Document",
    entityId: id,
    actorId: userId,
    description: `Updated document “${meta.title.trim()}”`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function softDeleteDocument(userId: string, id: string, ctx: Ctx = {}): Promise<void> {
  const doc = await prisma.document.findFirst({ where: { id, userId, deletedAt: null } });
  if (!doc) return;

  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });

  // Remove uploaded objects from storage; generated docs have no stored file.
  if (!doc.storageKey.startsWith("generated:")) {
    await deleteObject(doc.storageKey);
  }

  await recordAudit({
    action: "DELETE",
    entityType: "Document",
    entityId: id,
    actorId: userId,
    description: `Deleted document “${doc.title}”`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

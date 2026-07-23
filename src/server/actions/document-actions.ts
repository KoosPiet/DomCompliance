"use server";

import { redirect } from "next/navigation";
import type { DocumentType } from "@prisma/client";
import { auth } from "@/auth";
import { getRequestContext } from "@/lib/request";
import {
  documentMetaSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
} from "@/lib/validations/document";
import {
  uploadUserDocument,
  softDeleteDocument,
  DocumentError,
} from "@/server/services/document";

export type DocumentActionResult = { ok: true } | { ok: false; message: string };

export async function uploadDocumentAction(
  _prev: DocumentActionResult | null,
  formData: FormData,
): Promise<DocumentActionResult> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, message: "That file is too large (max 10MB)." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { ok: false, message: "Only PDF, JPG, PNG or WebP files are allowed." };
  }

  const meta = documentMetaSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    employeeId: formData.get("employeeId") ?? "",
  });
  if (!meta.success) {
    return { ok: false, message: "Please add a title and choose a type." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ctx = await getRequestContext();

  try {
    await uploadUserDocument(
      session.user.id,
      {
        title: meta.data.title,
        type: meta.data.type as DocumentType,
        employeeId: meta.data.employeeId || undefined,
        fileName: file.name,
        mimeType: file.type,
        bytes,
      },
      ctx,
    );
  } catch (e) {
    if (e instanceof DocumentError && e.code === "NOT_CONFIGURED") {
      return { ok: false, message: "File storage isn't configured yet." };
    }
    console.error("[document] Upload failed:", e);
    return { ok: false, message: "Upload failed. Please try again." };
  }

  redirect("/vault");
}

export async function deleteDocumentAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getRequestContext();
  await softDeleteDocument(session.user.id, id, ctx);
  redirect("/vault");
}

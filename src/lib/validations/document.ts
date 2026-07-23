import { z } from "zod";

/** Document types a user can upload (generated types like CONTRACT/PAYSLIP are excluded). */
export const UPLOAD_DOCUMENT_TYPES = [
  { value: "ID_DOCUMENT", label: "ID / Passport" },
  { value: "BANK_DETAILS", label: "Bank details" },
  { value: "WARNING", label: "Warning letter" },
  { value: "PERFORMANCE_REVIEW", label: "Performance review" },
  { value: "OTHER", label: "Other" },
] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export const documentMetaSchema = z.object({
  title: z.string().trim().min(2, "Give the document a title").max(160),
  type: z.enum(["ID_DOCUMENT", "BANK_DETAILS", "WARNING", "PERFORMANCE_REVIEW", "OTHER"]),
  employeeId: z.string().uuid().optional().or(z.literal("")),
});

export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;

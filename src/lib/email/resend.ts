import { Resend } from "resend";
import { env } from "@/env";

/**
 * Thin Resend wrapper. When RESEND_API_KEY is not configured (e.g. local dev)
 * emails are logged to the console instead of sent, so no flow ever breaks
 * for want of an email provider.
 */

const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  delivered: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!client) {
    console.info(
      `[email:dev] To: ${params.to} · Subject: ${params.subject}\n${params.text ?? "(html only)"}`,
    );
    return { delivered: false, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { delivered: false, error: error.message };
    }
    return { delivered: true, id: data?.id };
  } catch (error) {
    console.error("[email] Unexpected error:", error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { env } from "@/env";

/**
 * Transport-agnostic transactional email.
 *
 * Provider is chosen from the environment, in order:
 *   1. SMTP  — any provider (Brevo, Amazon SES, ZeptoMail, Mailgun, your host).
 *              Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD. Switching provider is an
 *              env-var change, never a code change — which keeps us free of
 *              per-provider daily send caps.
 *   2. Resend API — set RESEND_API_KEY.
 *   3. Neither  — emails are logged to the console instead of sent, so no flow
 *              ever breaks for want of an email provider (local dev).
 */

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

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

/** Which transport is active — surfaced for diagnostics/settings screens. */
export const emailTransport: "smtp" | "resend" | "none" = smtpConfigured
  ? "smtp"
  : env.RESEND_API_KEY
    ? "resend"
    : "none";

export const isEmailConfigured = emailTransport !== "none";

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Cached across invocations so a warm serverless instance reuses the connection.
let transporter: Transporter | null = null;
function smtp(): Transporter {
  if (!transporter) {
    const port = Number(env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      // Port 465 is implicit TLS; 587/25 upgrade via STARTTLS.
      secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (emailTransport === "none") {
    console.info(
      `[email:dev] To: ${params.to} · Subject: ${params.subject}\n${params.text ?? "(html only)"}`,
    );
    return { delivered: false, skipped: true };
  }

  try {
    if (emailTransport === "smtp") {
      const info = await smtp().sendMail({
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
      return { delivered: true, id: info.messageId };
    }

    const { data, error } = await resendClient!.emails.send({
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
    console.error(`[email] ${emailTransport} send failed:`, error);
    return {
      delivered: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

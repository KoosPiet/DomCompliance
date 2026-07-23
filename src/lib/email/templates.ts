import { siteConfig } from "@/config/site";

/**
 * Branded, table-based transactional email templates. Kept dependency-free
 * (inline styles) so they render consistently across email clients.
 */

const BRAND = "#0d9488"; // teal-600, matches the app primary
const BG = "#f5f7f7";
const TEXT = "#1f2937";
const MUTED = "#6b7280";

function layout(opts: { heading: string; body: string; cta?: { label: string; url: string } }): string {
  const cta = opts.cta
    ? `<tr><td style="padding:8px 0 24px;">
         <a href="${opts.cta.url}" style="background:${BRAND};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;display:inline-block;font-size:15px;">${opts.cta.label}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:28px 32px 8px;">
          <span style="font-size:20px;font-weight:700;color:${BRAND};letter-spacing:-0.02em;">${siteConfig.name}</span>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${TEXT};">${opts.heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:${TEXT};">${opts.body}</div>
        </td></tr>
        <tr><td style="padding:16px 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0">${cta}</table></td></tr>
        <tr><td style="padding:8px 32px 28px;">
          <p style="font-size:12px;line-height:1.6;color:${MUTED};margin:16px 0 0;border-top:1px solid #eef1f1;padding-top:16px;">
            ${siteConfig.name} — ${siteConfig.tagline}<br/>
            You are receiving this email because an account action was requested for this address.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function verificationEmail(params: { name?: string | null; url: string }) {
  const name = params.name ? `Hi ${params.name},` : "Hi there,";
  return {
    subject: "Verify your email — LabourMate",
    html: layout({
      heading: "Confirm your email address",
      body: `<p style="margin:0 0 12px;">${name}</p><p style="margin:0 0 12px;">Welcome to LabourMate. Please confirm your email address to secure your account and unlock your compliance dashboard.</p><p style="margin:0;color:${MUTED};font-size:13px;">This link expires in 24 hours.</p>`,
      cta: { label: "Verify email", url: params.url },
    }),
    text: `Confirm your email address for LabourMate: ${params.url} (expires in 24 hours).`,
  };
}

export function passwordResetEmail(params: { name?: string | null; url: string }) {
  const name = params.name ? `Hi ${params.name},` : "Hi there,";
  return {
    subject: "Reset your password — LabourMate",
    html: layout({
      heading: "Reset your password",
      body: `<p style="margin:0 0 12px;">${name}</p><p style="margin:0 0 12px;">We received a request to reset your LabourMate password. Click the button below to choose a new one.</p><p style="margin:0;color:${MUTED};font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
      cta: { label: "Reset password", url: params.url },
    }),
    text: `Reset your LabourMate password: ${params.url} (expires in 1 hour).`,
  };
}

export function welcomeEmail(params: { name?: string | null; url: string }) {
  const name = params.name ? `Welcome, ${params.name}!` : "Welcome!";
  return {
    subject: "Welcome to LabourMate 🎉",
    html: layout({
      heading: name,
      body: `<p style="margin:0 0 12px;">Your free trial is active. Here's how to become compliant in minutes:</p><ol style="margin:0 0 12px;padding-left:18px;color:${TEXT};font-size:15px;line-height:1.7;"><li>Add your employee's details</li><li>Generate a compliant employment contract</li><li>Create and send your first payslip</li></ol>`,
      cta: { label: "Go to dashboard", url: params.url },
    }),
    text: `Welcome to LabourMate! Your free trial is active. Get started: ${params.url}`,
  };
}

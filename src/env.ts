import { z } from "zod";

/**
 * Centralised, type-safe environment configuration.
 *
 * Server-only secrets are validated on the server; public values
 * (NEXT_PUBLIC_*) are validated everywhere. Validation runs at import time so
 * a misconfigured deployment fails fast with a clear message instead of a
 * confusing runtime error deep in a request handler.
 *
 * Set `SKIP_ENV_VALIDATION=1` for Docker/CI builds that don't have secrets.
 */

const isServer = typeof window === "undefined";
const skipValidation =
  !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database (Supabase Postgres — pooled for app, direct for migrations)
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // Auth.js v5
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url().optional(),

  // Application-layer PII encryption (AES-256-GCM). 32-byte key, base64 or hex.
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must decode to 32 bytes"),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("LabourMate <no-reply@labourmate.co.za>"),

  // Supabase (server)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("documents"),

  // Meta WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),

  // Netcash Pay Now
  NETCASH_PAYNOW_SERVICE_KEY: z.string().optional(),
  NETCASH_ACCOUNT_SERVICE_KEY: z.string().optional(),
  NETCASH_SOFTWARE_VENDOR_KEY: z.string().optional(),

  // Scheduled jobs (Vercel Cron / external scheduler)
  CRON_SECRET: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

/**
 * NEXT_PUBLIC_* variables must be referenced statically for Next.js to inline
 * them into the client bundle, so we build the object explicitly.
 */
const clientRuntime = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

function loadEnv(): ServerEnv & ClientEnv {
  const client = clientSchema.safeParse(clientRuntime);
  if (!client.success) {
    throw new Error(
      `❌ Invalid public environment variables:\n${formatIssues(client.error)}`,
    );
  }

  if (!isServer) {
    // On the client, only public vars exist; return them with server fields
    // left undefined (they are never read in client code).
    return { ...(client.data as ClientEnv) } as ServerEnv & ClientEnv;
  }

  const server = serverSchema.safeParse(process.env);
  if (!server.success) {
    throw new Error(
      `❌ Invalid server environment variables:\n${formatIssues(server.error)}`,
    );
  }

  return { ...server.data, ...client.data };
}

export const env: ServerEnv & ClientEnv = skipValidation
  ? ({
      ...clientRuntime,
      ...process.env,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    } as unknown as ServerEnv & ClientEnv)
  : loadEnv();

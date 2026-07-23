import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. `unsafe-inline` is required for Next.js's inline
 * bootstrap/styles and framer-motion; `unsafe-eval` is only added in
 * development (needed by the dev runtime). Tighten per your risk appetite.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // 'self' plus Netcash Pay Now, which we POST the checkout form to.
  "form-action 'self' https://paynow.netcash.co.za",
  "object-src 'none'",
]
  .join("; ")
  .concat(isDev ? "" : "; upgrade-insecure-requests");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Emit a standalone server bundle for lean Docker images. On Vercel we let its
  // native Next.js builder take over (it sets VERCEL=1), so skip standalone there.
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Allow document uploads (PDF/image) through Server Actions, up to ~10MB.
      bodySizeLimit: "12mb",
      // In dev only, accept Server Action POSTs proxied through a public tunnel
      // (VS Code / Cloudflare / ngrok) so a remote tester can submit forms.
      // Production stays locked to its own origin.
      ...(isDev
        ? {
            allowedOrigins: [
              "*.devtunnels.ms",
              "*.trycloudflare.com",
              "*.ngrok-free.app",
              "*.ngrok.io",
              "*.loca.lt",
            ],
          }
        : {}),
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

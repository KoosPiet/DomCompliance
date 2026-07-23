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
  // Emit a standalone server bundle for lean Docker images.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Allow document uploads (PDF/image) through Server Actions, up to ~10MB.
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

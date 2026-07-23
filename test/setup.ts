/**
 * Vitest global setup. Provides deterministic, non-secret env values so modules
 * that read `@/env` at import time (crypto, netcash) load cleanly. Validation is
 * skipped — these tests exercise pure domain/lib logic, never a real service.
 */
process.env.SKIP_ENV_VALIDATION = "1";
process.env.ENCRYPTION_KEY ||= "test-encryption-key-thirty-two-bytes-x";
process.env.AUTH_SECRET ||= "test-auth-secret-thirty-two-chars-minimum";
process.env.NEXT_PUBLIC_APP_URL ||= "http://localhost:3000";
process.env.NETCASH_PAYNOW_SERVICE_KEY ||= "test-service-key-123";
process.env.NETCASH_SOFTWARE_VENDOR_KEY ||= "test-vendor-key-456";

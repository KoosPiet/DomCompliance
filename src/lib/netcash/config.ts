/**
 * Netcash Pay Now configuration.
 *
 * LabourMate uses the same Netcash merchant account as TrailTime. The Pay Now
 * "service key" and "software vendor key" identify that account; they are not
 * secret in the Netcash Pay Now model (they are submitted in the browser form),
 * but we still source them from the environment so they can differ per
 * deployment and are never hard-coded in shipped bundles.
 *
 * Docs: https://api.netcash.co.za/inbound-payments/pay-now/pay-now-ecommerce/
 */

import { env } from "@/env";
import { siteConfig } from "@/config/site";

/** Live Netcash Pay Now endpoint (there is no separate sandbox host). */
export const NETCASH_PAYNOW_URL = "https://paynow.netcash.co.za/site/paynow.aspx";

/**
 * Netcash's generic software-vendor key for custom integrations. This is the
 * value the TrailTime integration uses; it is only a fallback — the real value
 * comes from NETCASH_SOFTWARE_VENDOR_KEY.
 */
const DEFAULT_SOFTWARE_VENDOR_KEY = "24ade73c-98cf-47b3-99be-cc7b867b3080";

export interface NetcashConfig {
  serviceKey: string;
  softwareVendorKey: string;
  payNowUrl: string;
  /** True when a Pay Now service key is present and checkout can proceed. */
  configured: boolean;
  urls: {
    accept: string;
    decline: string;
    redirect: string;
    notify: string;
  };
}

/** Resolve the Netcash configuration from the environment. Server-only. */
export function getNetcashConfig(): NetcashConfig {
  const serviceKey = env.NETCASH_PAYNOW_SERVICE_KEY ?? "";
  const base = siteConfig.url.replace(/\/$/, "");

  return {
    serviceKey,
    softwareVendorKey:
      env.NETCASH_SOFTWARE_VENDOR_KEY || DEFAULT_SOFTWARE_VENDOR_KEY,
    payNowUrl: NETCASH_PAYNOW_URL,
    configured: serviceKey.length > 0,
    urls: {
      accept: `${base}/payment/success`,
      decline: `${base}/payment/declined`,
      redirect: `${base}/payment/pending`,
      notify: `${base}/api/v1/payments/netcash/notify`,
    },
  };
}

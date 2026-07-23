import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/onboarding",
        "/settings",
        "/billing",
        "/admin",
        "/api/",
        "/login",
        "/register",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

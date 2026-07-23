import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * Build page metadata with sensible SEO + Open Graph + Twitter defaults.
 * Pass a page title/description/path to override.
 */
export function buildMetadata(params?: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const title = params?.title
    ? `${params.title} · ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const description = params?.description ?? siteConfig.description;
  const url = params?.path
    ? new URL(params.path, siteConfig.url).toString()
    : siteConfig.url;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: [...siteConfig.keywords],
    applicationName: siteConfig.name,
    alternates: { canonical: url },
    robots: params?.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_ZA",
      url,
      siteName: siteConfig.name,
      title,
      description,
      // Social image is generated dynamically by app/opengraph-image.tsx.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/icons/icon.svg",
    },
    appleWebApp: {
      capable: true,
      title: siteConfig.name,
      statusBarStyle: "default",
    },
    manifest: "/manifest.webmanifest",
  };
}

/** JSON-LD structured data for the organisation / SaaS product. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    areaServed: "ZA",
    sameAs: [siteConfig.social.facebook, siteConfig.social.twitter],
  };
}

export function softwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "49",
      priceCurrency: "ZAR",
    },
    description: siteConfig.description,
  };
}

/** JSON-LD structured data for a blog article / compliance guide. */
export function articleJsonLd(article: {
  slug: string;
  title: string;
  description: string;
  updated: string;
}) {
  const url = new URL(`/blog/${article.slug}`, siteConfig.url).toString();
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.updated,
    dateModified: article.updated,
    mainEntityOfPage: url,
    url,
    inLanguage: "en-ZA",
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}

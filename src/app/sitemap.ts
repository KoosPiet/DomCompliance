import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { ARTICLES } from "@/content/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/compliance-check", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/check", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/uif", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.5, changeFrequency: "weekly" as const },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const now = new Date();
  const staticEntries = routes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const articleEntries = ARTICLES.map((article) => ({
    url: new URL(`/blog/${article.slug}`, siteConfig.url).toString(),
    lastModified: new Date(article.updated),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries];
}

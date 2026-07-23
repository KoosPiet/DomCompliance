import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { buildMetadata, articleJsonLd } from "@/lib/seo";
import { ARTICLES, getArticle, relatedArticles } from "@/content/articles";
import { ArticleBody } from "@/components/content/article-body";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    return buildMetadata({ title: "Guide not found", path: `/blog/${slug}`, noIndex: true });
  }
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: `/blog/${article.slug}`,
  });
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = relatedArticles(slug);
  const jsonLd = articleJsonLd(article);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/blog">
          <ArrowLeft className="size-4" /> All guides
        </Link>
      </Button>

      <Badge variant="secondary">{article.category}</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{article.description}</p>
      <div className="mt-4 flex items-center gap-4 border-b pb-6 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" /> {article.readMinutes} min read
        </span>
        <span>Updated {fmt(article.updated)}</span>
      </div>

      <div className="mt-8">
        <ArticleBody blocks={article.body} />
      </div>

      {/* Conversion CTA */}
      <div className="mt-12 rounded-2xl border bg-primary/5 p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Become compliant in minutes</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          LabourMate handles contracts, payslips, UIF and leave for your domestic worker — as easy
          as online banking.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Start free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/check">Free compliance check</Link>
          </Button>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Keep reading
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {r.category}
                </span>
                <p className="mt-1.5 text-sm font-medium leading-snug">{r.title}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                  Read <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

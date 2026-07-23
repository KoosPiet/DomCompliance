import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { ARTICLES } from "@/content/articles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Compliance guides",
  description:
    "Practical, plain-language guides for South African homeowners on legally employing a domestic worker — contracts, UIF, payslips, wages and leave.",
  path: "/blog",
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

export default function BlogPage() {
  const [lead, ...rest] = ARTICLES;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center">
        <Badge variant="secondary">Compliance guides</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Learn to employ, legally
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Plain-language guides to South African domestic-worker compliance — written for
          homeowners, not lawyers.
        </p>
      </div>

      {/* Featured */}
      <Link
        href={`/blog/${lead.slug}`}
        className="group mt-12 flex flex-col rounded-2xl border bg-card p-8 transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">{lead.category}</span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{lead.title}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{lead.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" /> {lead.readMinutes} min read
          </span>
          <span>Updated {fmt(lead.updated)}</span>
        </div>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Read guide
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group flex flex-col rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              {article.category}
            </span>
            <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{article.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> {article.readMinutes} min read
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border bg-card p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Not sure where you stand?</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Take the free 1-minute compliance check and get a personalised score.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/check">Take the free check</Link>
        </Button>
      </div>
    </div>
  );
}

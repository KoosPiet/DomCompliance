import type { ReactNode } from "react";

/**
 * Presentational primitives for legal pages (Privacy / POPIA, Terms). Sections
 * accept arbitrary block content (paragraphs, lists, tables) and apply
 * consistent typography via descendant selectors, so page authors write plain
 * semantic HTML without repeating utility classes.
 */

export function LegalDoc({
  title,
  updated,
  effective,
  children,
}: {
  title: string;
  updated: string;
  effective?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
      {effective && (
        <p className="text-sm text-muted-foreground">Effective date: {effective}</p>
      )}
      <div className="mt-10 space-y-10">{children}</div>
    </article>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {heading}
      </h2>
      <div className="space-y-3 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h3]:mt-4 [&_h3]:font-medium [&_h3]:text-foreground [&_li]:marker:text-muted-foreground/50 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

const CALLOUT_TONES = {
  info: "border-primary/30 bg-primary/5",
  success: "border-success/30 bg-success/10",
  warning: "border-warning/40 bg-warning/10",
} as const;

export function LegalCallout({
  tone = "info",
  children,
}: {
  tone?: keyof typeof CALLOUT_TONES;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm leading-relaxed text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline ${CALLOUT_TONES[tone]}`}
    >
      {children}
    </div>
  );
}

/** A labelled contact / info block (e.g. the Information Officer details). */
export function LegalPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
      {children}
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { ViralChecker } from "@/components/compliance/viral-checker";

export const metadata = buildMetadata({
  title: "Free 1-minute Compliance Check",
  description:
    "Answer 3 quick questions to see if you're legally compliant employing a domestic worker in South Africa. Free, instant, no signup.",
  path: "/check",
  // Use this route's own opengraph-image.tsx (the attention-grabbing ad card).
  ogImage: null,
});

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:py-20">
      <div className="mb-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Are you legally compliant?
        </h1>
        <p className="mt-3 text-muted-foreground">
          3 quick questions. Instant score. No signup required.
        </p>
      </div>
      <ViralChecker />
    </div>
  );
}

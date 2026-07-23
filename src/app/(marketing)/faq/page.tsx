import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about legally employing a domestic worker in South Africa — contracts, UIF, payslips, leave and LabourMate.",
  path: "/faq",
});

const FAQS = [
  {
    q: "Do I really need a contract for my domestic worker?",
    a: "Yes. The Basic Conditions of Employment Act and Sectoral Determination 7 require a written particulars of employment from the first day. LabourMate generates a compliant contract in minutes.",
  },
  {
    q: "What is UIF and do I have to register?",
    a: "The Unemployment Insurance Fund provides your worker with benefits if they lose their job, get sick, or go on maternity leave. Registration is compulsory within 14 days of employing someone, and you contribute 1% while deducting 1% from the worker.",
  },
  {
    q: "How much must I pay my domestic worker?",
    a: "At least the National Minimum Wage for domestic workers (R28.79 per ordinary hour from 1 March 2025). LabourMate helps you calculate a compliant salary and payslip.",
  },
  {
    q: "What leave is my worker entitled to?",
    a: "Annual leave (roughly 15 working days a year for a 5-day week), sick leave (up to 30 days over a 3-year cycle) and 3 days' family responsibility leave. LabourMate tracks and calculates all of these automatically.",
  },
  {
    q: "Is LabourMate a law firm?",
    a: "No. LabourMate provides tools and guidance based on South African labour legislation. For complex disputes we recommend consulting a labour law professional.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Sensitive information like ID and bank details is encrypted, and we handle personal information in line with POPIA. You control your data and can export or delete it.",
  },
  {
    q: "Can I send payslips on WhatsApp?",
    a: "Yes — with Premium you can generate a payslip PDF and send it straight to your worker on WhatsApp with one tap.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center">
        <Badge variant="secondary">FAQ</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Questions, answered
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Everything you need to know about compliance and LabourMate.
        </p>
      </div>

      <Accordion type="single" collapsible className="mt-12">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q}>
            <AccordionTrigger className="text-left text-base">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-14 rounded-2xl border bg-muted/40 p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Still not sure where you stand?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Take the free 2-minute compliance check and find out.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/compliance-check">Take the free check</Link>
        </Button>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
    </div>
  );
}

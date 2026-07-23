import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { formatZar, fromCents } from "@/domain/money";

export const metadata = buildMetadata({
  title: "Payment status",
  path: "/payment",
  noIndex: true,
});

type View = "confirmed" | "processing" | "failed";

const COPY: Record<
  View,
  { icon: typeof CheckCircle2; tone: string; title: string; body: string }
> = {
  confirmed: {
    icon: CheckCircle2,
    tone: "text-success",
    title: "You're on Premium 🎉",
    body: "Your payment was confirmed and your account has been upgraded to unlimited employees, payslips and contracts.",
  },
  processing: {
    icon: Clock,
    tone: "text-warning",
    title: "Payment received — confirming",
    body: "Thanks! We're waiting for Netcash to confirm your payment. This usually takes a few seconds. Your plan will update automatically — you can safely leave this page.",
  },
  failed: {
    icon: XCircle,
    tone: "text-danger",
    title: "Payment not completed",
    body: "Your payment wasn't completed and you have not been charged. You can try again at any time.",
  },
};

export default async function PaymentStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { status } = await params;
  const { ref } = await searchParams;

  const payment = ref
    ? await prisma.payment.findFirst({
        where: { providerReference: ref },
        select: { status: true, amountZarCents: true },
      })
    : null;

  // Authoritative view derives from the payment record; the URL is only a hint.
  let view: View;
  if (payment?.status === "COMPLETED") view = "confirmed";
  else if (payment?.status === "FAILED" || status === "declined") view = "failed";
  else view = "processing";

  const { icon: Icon, tone, title, body } = COPY[view];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Icon className={`size-9 ${tone}`} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-muted-foreground">{body}</p>

      {payment && (
        <p className="mt-4 text-sm text-muted-foreground">
          Amount: <strong>{formatZar(fromCents(payment.amountZarCents))}</strong>
          {ref && (
            <>
              {" · "}Reference: <span className="font-mono">{ref}</span>
            </>
          )}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {view === "failed" ? (
          <Button asChild>
            <Link href="/billing">Try again</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/billing">View billing</Link>
        </Button>
      </div>
    </div>
  );
}

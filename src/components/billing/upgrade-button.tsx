"use client";

import { useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "@/server/actions/billing-actions";
import type { PlanId } from "@/config/site";
import type { ComponentProps, ReactNode } from "react";

/**
 * Build a hidden form for the Netcash Pay Now fields and submit it, navigating
 * the browser (top-level) to Netcash's hosted payment page. This mirrors the
 * proven TrailTime `initiatePayment` approach.
 */
function submitToNetcash(action: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export function UpgradeButton({
  planId,
  children,
  variant,
  className,
}: {
  planId: PlanId;
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await startCheckoutAction(planId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      submitToNetcash(result.action, result.fields);
    });
  }

  return (
    <Button
      onClick={onClick}
      disabled={pending}
      variant={variant}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Redirecting to Netcash…
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}

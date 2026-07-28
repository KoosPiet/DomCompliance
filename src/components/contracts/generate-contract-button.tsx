"use client";

import { useTransition } from "react";
import { FileSignature, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateContractAction } from "@/server/actions/contract-actions";

/**
 * Generates a contract for an employee. Uses a client action rather than a
 * plain form post so a refusal (e.g. the employee has left) surfaces as a
 * toast instead of Next's generic server-error page.
 */
export function GenerateContractButton({
  employeeId,
  label = "Generate contract",
  size,
  variant,
}: {
  employeeId: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size={size}
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // Success redirects server-side; only failures return here.
          const res = await generateContractAction(employeeId);
          if (res && !res.ok) toast.error(res.message);
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileSignature className="size-4" />
      )}
      {label}
    </Button>
  );
}

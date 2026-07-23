"use client";

import { useState, useTransition } from "react";
import { Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/contracts/signature-pad";
import { signContractAction } from "@/server/actions/contract-actions";

export function SignContract({
  contractId,
  employerName,
}: {
  contractId: string;
  employerName: string;
}) {
  const [name, setName] = useState(employerName ?? "");
  const [signature, setSignature] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (name.trim().length < 2) {
      toast.error("Type your full name to sign.");
      return;
    }
    if (!signature) {
      toast.error("Please add your signature above.");
      return;
    }
    startTransition(async () => {
      const res = await signContractAction(contractId, {
        signatureName: name.trim(),
        signatureData: signature,
      });
      // Success redirects server-side; only failures return.
      if (res && !res.ok) toast.error(res.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sig-name">Full name</Label>
        <Input
          id="sig-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Signature</Label>
        <SignaturePad onChange={setSignature} />
      </div>
      <Button onClick={submit} disabled={pending} className="h-11">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
        Sign contract
      </Button>
      <p className="text-xs text-muted-foreground">
        By signing you confirm the details are correct. Your name, the date and
        your IP address are recorded with the signature.
      </p>
    </div>
  );
}

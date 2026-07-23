"use client";

import { useTransition } from "react";
import { Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  sendPayslipEmailAction,
  sendPayslipWhatsappAction,
} from "@/server/actions/payslip-actions";

export function SendPayslip({
  id,
  hasEmail,
}: {
  id: string;
  hasEmail: boolean;
}) {
  const [emailPending, startEmail] = useTransition();
  const [waPending, startWa] = useTransition();

  function email() {
    startEmail(async () => {
      const r = await sendPayslipEmailAction(id);
      if (r.status === "sent") toast.success(r.message);
      else if (r.status === "skipped") toast.info(r.message);
      else toast.error(r.message);
    });
  }

  function whatsapp() {
    startWa(async () => {
      const r = await sendPayslipWhatsappAction(id);
      if (r.mode === "sent") {
        toast.success("Payslip sent on WhatsApp.");
      } else if (r.mode === "fallback") {
        window.open(r.url, "_blank", "noopener");
        toast.info("Opening WhatsApp — attach the downloaded PDF to your message.");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={whatsapp} disabled={waPending}>
        {waPending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
        Send on WhatsApp
      </Button>
      <Button onClick={email} variant="outline" disabled={emailPending || !hasEmail}>
        {emailPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        Email
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CANCELLATION_REASONS,
  type CancelSubscriptionInput,
} from "@/lib/validations/billing";
import {
  cancelSubscriptionAction,
  resumeSubscriptionAction,
} from "@/server/actions/billing-actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function CancelSubscriptionButton({ endsAt }: { endsAt?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reason, setReason] =
    useState<CancelSubscriptionInput["reason"]>("NO_LONGER_EMPLOY");
  const [note, setNote] = useState("");

  const selected = CANCELLATION_REASONS.find((r) => r.value === reason);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await cancelSubscriptionAction({ reason, note });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Cancel subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your subscription?</DialogTitle>
          <DialogDescription>
            {endsAt
              ? `You keep full access until ${endsAt} — you've already paid for that time. After that your account returns to the free plan.`
              : "You keep access until the end of the period you've already paid for. After that your account returns to the free plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">What made you decide to cancel?</Label>
            <select
              id="cancel-reason"
              className={selectClass}
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as CancelSubscriptionInput["reason"])
              }
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {selected?.hint && (
              <p className="text-xs text-muted-foreground">{selected.hint}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-note">
              Anything else?{" "}
              {reason === "OTHER" ? "" : <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <Textarea
              id="cancel-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Honest feedback helps us fix it"
            />
          </div>
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Your records stay in your account. You can download contracts,
            payslips and documents at any time, and you can resubscribe whenever
            you like.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep my subscription
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Cancel subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResumeSubscriptionButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await resumeSubscriptionAction();
          if (res.ok) {
            toast.success(res.message);
            router.refresh();
          } else {
            toast.error(res.message);
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
      Resume subscription
    </Button>
  );
}

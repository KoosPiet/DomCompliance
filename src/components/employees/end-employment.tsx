"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, TriangleAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
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
  TERMINATION_REASONS,
  DISMISSAL_REASONS,
  REINSTATEMENT_REASONS,
  type EndEmploymentInput,
  type ReinstateInput,
} from "@/lib/validations/employment";
import {
  endEmploymentAction,
  reinstateEmployeeAction,
} from "@/server/actions/employee-actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function EndEmploymentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState<EndEmploymentInput["reason"]>("RESIGNED");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const selected = TERMINATION_REASONS.find((r) => r.value === reason);
  const isDismissal = (DISMISSAL_REASONS as readonly string[]).includes(reason);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await endEmploymentAction(id, { reason, endDate, note });
      if (res.ok) {
        toast.success(`${name} recorded as no longer employed.`);
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
        <Button variant="outline">
          <LogOut className="size-4" /> End employment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End employment for {name}</DialogTitle>
          <DialogDescription>
            This stops new payslips and contracts being issued. All existing
            records stay in your vault — you must keep them for three years.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="end-reason">Reason</Label>
            <select
              id="end-reason"
              className={selectClass}
              value={reason}
              onChange={(e) => setReason(e.target.value as EndEmploymentInput["reason"])}
            >
              {TERMINATION_REASONS.map((r) => (
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
            <Label htmlFor="end-date">Last day of employment</Label>
            <DatePicker id="end-date" value={endDate} onChange={setEndDate} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end-note">
              Notes {reason === "OTHER" ? "" : <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <Textarea
              id="end-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth recording for your files"
            />
          </div>

          {isDismissal && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-xs text-foreground/90">
                Dismissals and retrenchments must follow a fair procedure. Keep
                written records of warnings, hearings or consultations — the
                CCMA will ask for them if the dismissal is challenged.
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              End employment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReinstateButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState<ReinstateInput["reason"]>("LOGGED_IN_ERROR");
  const [note, setNote] = useState("");

  const selected = REINSTATEMENT_REASONS.find((r) => r.value === reason);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await reinstateEmployeeAction(id, { reason, note });
      if (res.ok) {
        toast.success(`${name} is an active employee again.`);
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
        <Button variant="outline">
          <Undo2 className="size-4" /> Reinstate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reinstate {name}</DialogTitle>
          <DialogDescription>
            This makes them an active employee again, so payslips and contracts
            work as normal. The reason is kept in your activity log.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reinstate-reason">Reason</Label>
            <select
              id="reinstate-reason"
              className={selectClass}
              value={reason}
              onChange={(e) => setReason(e.target.value as ReinstateInput["reason"])}
            >
              {REINSTATEMENT_REASONS.map((r) => (
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
            <Label htmlFor="reinstate-note">
              Notes{" "}
              {reason === "OTHER" ? "" : <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <Textarea
              id="reinstate-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth recording for your files"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
              Reinstate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { uploadDocumentAction } from "@/server/actions/document-actions";
import { UPLOAD_DOCUMENT_TYPES } from "@/lib/validations/document";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function UploadDocument({
  employees,
  defaultEmployeeId,
  label = "Upload",
}: {
  employees: { id: string; name: string }[];
  defaultEmployeeId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(uploadDocumentAction, null);

  useEffect(() => {
    if (state && !state.ok) toast.error(state.message);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="size-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>
            PDF or image, up to 10MB. Stored securely and encrypted in transit.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              name="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input id="doc-title" name="title" placeholder="e.g. Grace — ID copy" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Type</Label>
              <select id="doc-type" name="type" className={selectClass} defaultValue="ID_DOCUMENT">
                {UPLOAD_DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-employee">Employee</Label>
              <select
                id="doc-employee"
                name="employeeId"
                className={selectClass}
                defaultValue={defaultEmployeeId ?? ""}
              >
                <option value="">— None —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

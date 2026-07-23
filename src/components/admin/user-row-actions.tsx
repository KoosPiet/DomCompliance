"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";
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
} from "@/components/ui/dialog";
import {
  ADMIN_ROLE_OPTIONS,
  type AdminUpdateUserInput,
} from "@/lib/validations/admin";
import { updateUserAction, deleteUserAction } from "@/server/actions/admin-actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function UserRowActions({
  user,
  currentAdminId,
}: {
  user: AdminUserRow;
  currentAdminId: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);

  const isSelf = user.id === currentAdminId;

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    const input: AdminUpdateUserInput = { name, email, role, isActive };
    startTransition(async () => {
      const res = await updateUserAction(user.id, input);
      if (res.ok) {
        toast.success(res.message);
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (res.ok) {
        toast.success(res.message);
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" /> Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-danger hover:text-danger"
        onClick={() => setDeleteOpen(true)}
        disabled={isSelf}
        title={isSelf ? "You can't delete your own account" : "Delete user"}
      >
        <Trash2 className="size-4" />
      </Button>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-user-name">Name</Label>
              <Input
                id="admin-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-user-email">Email</Label>
              <Input
                id="admin-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-user-role">Role</Label>
              <select
                id="admin-user-role"
                className={selectClass}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isSelf}
              >
                {ADMIN_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  You can&apos;t change your own role.
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSelf}
              />
              Account active
              <span className="text-muted-foreground">
                — unchecked suspends sign-in
              </span>
            </label>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-danger" />
              Delete this user?
            </DialogTitle>
            <DialogDescription>
              This deactivates <span className="font-medium">{user.email}</span>{" "}
              and removes them from the platform — they will no longer be able to
              sign in. Their records are retained for audit and can be restored
              if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

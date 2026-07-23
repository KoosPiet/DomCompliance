"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { resetPasswordAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  function onSubmit(values: ResetPasswordInput) {
    startTransition(async () => {
      const res = await resetPasswordAction({ ...values, token });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message ?? "Password reset.");
      router.push("/login");
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Choose a strong password you don&apos;t use elsewhere.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <input type="hidden" value={token} {...register("token")} />
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-danger">{errors.password.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      const res = await forgotPasswordAction(values);
      if (res.ok && res.message) setSentMessage(res.message);
    });
  }

  if (sentMessage) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">{sentMessage}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

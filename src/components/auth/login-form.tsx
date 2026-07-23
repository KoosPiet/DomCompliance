"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginInput) {
    startTransition(async () => {
      const res = await loginAction(values);
      if (!res.ok) toast.error(res.message);
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to your LabourMate account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-danger">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to LabourMate?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}

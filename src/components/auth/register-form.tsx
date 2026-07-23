"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  function onSubmit(values: RegisterInput) {
    startTransition(async () => {
      const res = await registerAction(values);
      if (!res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof RegisterInput, { message: messages[0] });
            }
          }
        }
        toast.error(res.message);
      } else if (res.message) {
        toast.success(res.message);
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Create your free account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Start your free trial. No card required.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-danger">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms and POPIA-compliant Privacy
          Policy.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

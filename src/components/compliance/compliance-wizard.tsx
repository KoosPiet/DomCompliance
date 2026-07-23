"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { COMPLIANCE_QUESTIONS } from "@/domain/compliance/questions";
import type { ComplianceQuestionId } from "@/domain/compliance/questions";
import type { ComplianceResult } from "@/domain/compliance/scoring";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/server/actions/auth-actions";
import { EASE_OUT } from "@/lib/motion";
import { ScoreGauge } from "@/components/compliance/score-gauge";
import { ShareButtons } from "@/components/compliance/share-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Answers = Partial<Record<ComplianceQuestionId, boolean>>;
type Phase = "questions" | "loading" | "result";

const TOTAL = COMPLIANCE_QUESTIONS.length;

export function ComplianceWizard() {
  const [phase, setPhase] = useState<Phase>("questions");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const question = COMPLIANCE_QUESTIONS[index];

  async function submit(finalAnswers: Answers) {
    setPhase("loading");
    try {
      const res = await fetch("/api/v1/compliance/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, source: "LANDING" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Request failed");
      setResult(json.data.result as ComplianceResult);
      setAssessmentId(json.data.assessmentId ?? null);
      setPhase("result");
    } catch {
      toast.error("We couldn't score your answers. Please try again.");
      setPhase("questions");
    }
  }

  function answer(value: boolean) {
    const next: Answers = { ...answers, [question.id]: value };
    setAnswers(next);

    // Gating question answered "no" → nothing else applies; score now.
    if (question.gating && value === false) {
      void submit(next);
      return;
    }
    if (index + 1 >= TOTAL) {
      void submit(next);
      return;
    }
    setIndex((i) => i + 1);
  }

  function back() {
    if (index > 0) setIndex((i) => i - 1);
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setResult(null);
    setAssessmentId(null);
    setPhase("questions");
  }

  const progress = Math.round((index / TOTAL) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {phase === "questions" && (
        <div>
          <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {index + 1} of {TOTAL}
            </span>
            <span>{progress}% complete</span>
          </div>
          <Progress value={progress} className="mb-8 h-1.5" />

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <Badge variant="secondary" className="mb-4">
                {question.legislation}
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {question.prompt}
              </h1>
              <p className="mt-3 text-muted-foreground">{question.helper}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <AnswerButton
                  variant="yes"
                  selected={answers[question.id] === true}
                  onClick={() => answer(true)}
                />
                <AnswerButton
                  variant="no"
                  selected={answers[question.id] === false}
                  onClick={() => answer(false)}
                />
              </div>

              {index > 0 && (
                <Button
                  variant="ghost"
                  className="mt-6 text-muted-foreground"
                  onClick={back}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Calculating your compliance score…
          </p>
        </div>
      )}

      {phase === "result" && result && (
        <ResultView
          result={result}
          assessmentId={assessmentId}
          onRestart={restart}
        />
      )}
    </div>
  );
}

function AnswerButton({
  variant,
  selected,
  onClick,
}: {
  variant: "yes" | "no";
  selected: boolean;
  onClick: () => void;
}) {
  const isYes = variant === "yes";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex items-center justify-between rounded-xl border-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
        selected
          ? isYes
            ? "border-success bg-success/10"
            : "border-warning bg-warning/10"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <span className="text-lg font-medium">{isYes ? "Yes" : "No"}</span>
      <span
        className={`flex size-8 items-center justify-center rounded-full transition-colors ${
          isYes
            ? "bg-success/15 text-success"
            : "bg-warning/15 text-warning"
        }`}
      >
        {isYes ? <Check className="size-4" /> : <X className="size-4" />}
      </span>
    </button>
  );
}

function ResultView({
  result,
  assessmentId,
  onRestart,
}: {
  result: ComplianceResult;
  assessmentId: string | null;
  onRestart: () => void;
}) {
  const atRisk = result.score < 80 && !result.notApplicable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col items-center text-center">
        <ScoreGauge score={result.score} rating={result.rating} />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          {result.notApplicable
            ? "No obligations just yet"
            : `You scored ${result.score}%`}
        </h1>
        <p className="mt-3 max-w-md text-pretty text-muted-foreground">
          {result.headline}
        </p>
      </div>

      {atRisk && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" />
          <p className="text-sm text-foreground/90">
            You may be at risk of Labour Department penalties and disputes.
            Based on your answers, some legal requirements are not yet in place.
          </p>
        </div>
      )}

      {result.risks.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldAlert className="size-4" />
            {result.risks.length} gap{result.risks.length > 1 ? "s" : ""} to fix
          </h2>
          <ul className="space-y-2">
            {result.risks.map((risk) => (
              <li
                key={risk.questionId}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <X className="mt-0.5 size-4 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-medium">{risk.prompt}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {risk.message}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {risk.legislation}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.notApplicable ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <ShieldCheck className="size-5 shrink-0 text-success" />
          <p className="text-sm">
            Save LabourMate for the day you do hire — we&apos;ll have you
            compliant in minutes.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="mb-3 text-sm font-medium">
          Share this free check with other homeowners:
        </p>
        <ShareButtons score={result.score} />
      </div>

      <TrialCaptureForm assessmentId={assessmentId} atRisk={atRisk} />

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onRestart}>
          Retake the check
        </Button>
      </div>
    </motion.div>
  );
}

function TrialCaptureForm({
  assessmentId,
  atRisk,
}: {
  assessmentId: string | null;
  atRisk: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { assessmentId: assessmentId ?? undefined },
  });

  function onSubmit(values: RegisterInput) {
    startTransition(async () => {
      const res = await registerAction({
        ...values,
        assessmentId: assessmentId ?? undefined,
      });
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
      // On success the server action redirects to /onboarding.
    });
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-lg shadow-primary/5">
      <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="size-3.5" />
        Free trial · No card required
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">
        {atRisk ? "Become compliant in minutes" : "Create your free account"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Save your results and generate your contract, payslip and records — free
        to start.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" placeholder="Thandi Mokoena" {...register("name")} />
          {errors.name && <FieldError message={errors.name.message} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.co.za"
            {...register("email")}
          />
          {errors.email && <FieldError message={errors.email.message} />}
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
          {errors.password && <FieldError message={errors.password.message} />}
        </div>

        <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BadgeCheck className="size-4" />
          )}
          Start my free trial
          {!pending && <ArrowRight className="size-4" />}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms and POPIA-compliant Privacy
          Policy.
        </p>
      </form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

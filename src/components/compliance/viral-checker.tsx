"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import {
  VIRAL_QUESTIONS,
  type ViralAnswers,
  type ViralQuestionId,
} from "@/domain/compliance/viral";
import { submitViralCheckAction } from "@/server/actions/viral-actions";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/compliance/score-gauge";
import { ShareButtons } from "@/components/compliance/share-buttons";
import type { ComplianceRating } from "@/domain/compliance/scoring";

function subline(score: number): string {
  if (score >= 80) return "You're on top of the basics. A few small steps and you're fully compliant.";
  if (score >= 50) return "You're partly compliant, but there are gaps that could cost you in a CCMA dispute.";
  return "Based on your answers you may not be complying with South African domestic worker legislation.";
}

export function ViralChecker() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ViralAnswers>>({});
  const [result, setResult] = useState<{ score: number; rating: ComplianceRating } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = VIRAL_QUESTIONS.length;

  async function answer(id: ViralQuestionId, value: boolean) {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    const res = await submitViralCheckAction(next as ViralAnswers);
    setSubmitting(false);
    if (res.ok) setResult({ score: res.score, rating: res.rating });
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setResult(null);
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Calculating your compliance score…</p>
      </div>
    );
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <ScoreGauge score={result.score} rating={result.rating} size={180} />
        <h2 className="mt-6 text-3xl font-semibold tracking-tight">You scored {result.score}%</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{subline(result.score)}</p>

        <div className="mt-8 w-full max-w-md rounded-2xl border bg-card p-6 text-left">
          <p className="font-semibold">Become compliant in minutes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your free LabourMate account — generate a contract, issue payslips and get
            UIF-ready today.
          </p>
          <Button asChild size="lg" className="mt-4 w-full">
            <Link href="/register">
              Create your free account <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-sm text-muted-foreground">
            Know someone who employs a domestic worker? Share this check:
          </p>
          <div className="flex justify-center">
            <ShareButtons score={result.score} path="/check" />
          </div>
        </div>

        <button
          onClick={restart}
          className="mt-6 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Retake the check
        </button>
      </motion.div>
    );
  }

  const question = VIRAL_QUESTIONS[step];
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {step + 1} / {total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-8 text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight">{question.prompt}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{question.help}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => answer(question.id, false)}
              className="min-w-28"
            >
              <X className="size-4" /> No
            </Button>
            <Button size="lg" onClick={() => answer(question.id, true)} className="min-w-28">
              <Check className="size-4" /> Yes
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

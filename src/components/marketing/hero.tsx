"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/lib/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: EASE_OUT },
  }),
};

const trustPoints = [
  { icon: Clock, label: "2-minute check" },
  { icon: ShieldCheck, label: "No card required" },
  { icon: Lock, label: "POPIA-safe" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-radial-fade" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div className="flex flex-col items-start">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-warning" />
            </span>
            Over 1 million SA homes employ domestic workers
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Are you{" "}
            <span className="text-gradient-brand">legally compliant?</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground"
          >
            If you employ a domestic worker, nanny, gardener or caregiver, South
            African law requires contracts, payslips, UIF and records.
            LabourMate makes it as easy as online banking — and shows you exactly
            where you stand in 2 minutes.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href="/compliance-check">
                Take the FREE Compliance Check
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base"
            >
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </motion.div>

          <motion.ul
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
          >
            {trustPoints.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE_OUT }}
          className="relative flex items-center justify-center"
        >
          <HeroScoreCard />
        </motion.div>
      </div>
    </section>
  );
}

/** A polished product visual — a mock compliance-score dashboard card. */
function HeroScoreCard() {
  const items = [
    { label: "Written contract", ok: true },
    { label: "Monthly payslips", ok: true },
    { label: "UIF registered", ok: true },
    { label: "UIF submitted monthly", ok: false },
    { label: "Leave records", ok: true },
  ];

  return (
    <div className="w-full max-w-sm rounded-2xl border bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your compliance score</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">86%</p>
        </div>
        <div className="relative grid size-16 place-items-center">
          <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              className="stroke-muted"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              className="stroke-success"
              strokeWidth="3"
              strokeDasharray="86 100"
              strokeLinecap="round"
            />
          </svg>
          <ShieldCheck className="absolute size-6 text-success" />
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-foreground/90">{item.label}</span>
            {item.ok ? (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="size-4" /> Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                Action needed
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        LabourMate found 1 gap and generated your fix list automatically.
      </div>
    </div>
  );
}

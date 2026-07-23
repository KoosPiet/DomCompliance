"use client";

import { motion } from "framer-motion";
import type { ComplianceRating } from "@/domain/compliance/scoring";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

const RATING_STYLES: Record<
  ComplianceRating,
  { stroke: string; text: string; label: string }
> = {
  GREEN: { stroke: "stroke-success", text: "text-success", label: "Compliant" },
  ORANGE: { stroke: "stroke-warning", text: "text-warning", label: "At risk" },
  RED: { stroke: "stroke-danger", text: "text-danger", label: "High risk" },
};

const RADIUS = 15.9155; // circumference ≈ 100 for easy dash maths

export function ScoreGauge({
  score,
  rating,
  size = 176,
}: {
  score: number;
  rating: ComplianceRating;
  size?: number;
}) {
  const styles = RATING_STYLES[rating];

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Compliance score ${score} percent — ${styles.label}`}
    >
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          className="stroke-muted"
          strokeWidth="2.6"
        />
        <motion.circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          className={styles.stroke}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="100 100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - score }}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className={cn("text-4xl font-semibold tracking-tight", styles.text)}
        >
          {score}%
        </motion.span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {styles.label}
        </span>
      </div>
    </div>
  );
}

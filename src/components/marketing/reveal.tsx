"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";

/**
 * Scroll-triggered fade-up. Animates once when it enters the viewport.
 * Respects the user's reduced-motion preference automatically via Framer.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  ...props
}: {
  children: ReactNode;
  delay?: number;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

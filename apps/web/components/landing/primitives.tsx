"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE, EASE_CLASS, FOCUS_RING, T_HOVER, T_MOVE } from "./tokens";

export { EASE, EASE_CLASS, FOCUS_RING, T_HOVER, T_MOVE };

/**
 * Scroll reveal. Rises 32px and fades in over 700ms on the base curve, once.
 * With reduced motion it is a plain opacity change.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type ButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
};

/** Main button: 8px vertical and 12px horizontal padding, radius 8px. */
export function LandingButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 active:scale-[0.98]",
        size === "md" ? "button-md" : "button-sm",
        T_HOVER,
        FOCUS_RING,
        variant === "primary"
          ? "bg-lp-accent text-white hover:bg-lp-accent-hover"
          : "border border-lp-border bg-lp-bg text-lp-ink hover:bg-lp-surface-subtle",
        className,
      )}
    />
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("caption-3 text-lp-accent-ink", className)}>{children}</p>;
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-[680px]", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="heading-2 mt-4 text-lp-ink">
        {title}
      </h2>
      {children ? <p className="body-3 mt-4 text-lp-body">{children}</p> : null}
    </Reveal>
  );
}

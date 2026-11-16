import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "lilac" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-ui-teal text-white hover:bg-ui-teal-hover disabled:bg-ui-teal/40 focus-visible:outline-ui-teal",
  secondary:
    "bg-ui-surface text-ui-ink border border-ui-border hover:bg-ui-linen/70 hover:border-ui-muted/50 disabled:text-ui-muted focus-visible:outline-ui-teal",
  lilac:
    "bg-ui-teal-soft text-ui-teal border border-ui-teal/30 hover:bg-ui-teal-soft/80 disabled:opacity-50 focus-visible:outline-ui-teal",
  danger:
    "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300 focus-visible:outline-red-600",
  ghost:
    "bg-transparent text-ui-body hover:bg-ui-linen hover:text-ui-ink disabled:text-ui-muted focus-visible:outline-ui-teal",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-[var(--radius-button)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius-button)]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

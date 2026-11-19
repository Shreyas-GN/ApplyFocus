import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "lilac"
    | "danger"
    | "ghost"
    | "default"
    | "destructive"
    | "outline"
    | "link";
  size?: "sm" | "md" | "default" | "lg" | "icon" | "icon-lg";
  loading?: boolean;
  asChild?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-ui-teal text-white hover:bg-ui-teal-hover disabled:bg-ui-teal/40 focus-visible:outline-ui-teal",
  default:
    "bg-ui-teal text-white hover:bg-ui-teal-hover disabled:bg-ui-teal/40 focus-visible:outline-ui-teal",
  secondary:
    "bg-ui-surface text-ui-ink border border-ui-border hover:bg-ui-linen/70 hover:border-ui-muted/50 disabled:text-ui-muted focus-visible:outline-ui-teal",
  lilac:
    "bg-ui-teal-soft text-ui-teal border border-ui-teal/30 hover:bg-ui-teal-soft/80 disabled:opacity-50 focus-visible:outline-ui-teal",
  danger:
    "bg-ui-error text-white hover:bg-ui-error disabled:bg-ui-error focus-visible:outline-ui-error/30",
  destructive:
    "bg-ui-error text-white hover:bg-ui-error disabled:bg-ui-error focus-visible:outline-ui-error/30",
  ghost:
    "bg-transparent text-ui-body hover:bg-ui-linen hover:text-ui-ink disabled:text-ui-muted focus-visible:outline-ui-teal",
  outline:
    "border border-ui-border bg-white hover:bg-ui-border hover:text-ui-ink",
  link:
    "text-ui-teal underline-offset-4 hover:underline",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-[var(--radius-button)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius-button)]",
  default: "h-10 px-4 text-sm rounded-[var(--radius-button)]",
  lg: "h-11 px-8 rounded-xl text-base",
  icon: "h-9 w-9 rounded-full p-0 flex items-center justify-center",
  "icon-lg": "h-10 w-10 rounded-full p-0 flex items-center justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          className
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

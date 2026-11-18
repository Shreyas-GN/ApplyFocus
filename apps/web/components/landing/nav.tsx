"use client";

import * as React from "react";
import Link from "next/link";
import { LogoTile } from "@/components/brand/logo";
import { ArrowRight, Moon, Sun } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { EASE_CLASS, FOCUS_RING, LandingButton, T_HOVER, T_MOVE } from "./primitives";

const LINKS = [
  { label: "Benefits", href: "#benefits" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

const emptySubscribe = () => () => {};

export function LandingNav() {
  const [open, setOpen] = React.useState(false);
  const menuButton = React.useRef<HTMLButtonElement>(null);
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { theme, toggle } = useTheme();
  const isDark = mounted && theme === "dark";

  // Lock page scroll and close on Escape while the mobile panel is open.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  // Link entrance: 60ms steps, delays capped at 400ms.
  const stagger = (i: number) => ({ transitionDelay: open ? `${Math.min(i * 60, 400)}ms` : "0ms" });
  const itemMotion = cn(T_MOVE, open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0");

  const line = "absolute left-0 h-0.5 w-5 rounded-full bg-current";

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-fit max-w-full items-center gap-2 rounded-2xl border border-lp-border bg-lp-bg/70 p-2 shadow-sm backdrop-blur-xl">
          <Link
            href="/"
            aria-current="page"
            className={cn("flex items-center gap-2 rounded-lg pr-2", FOCUS_RING)}
          >
            <LogoTile className="size-8" />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={cn(
                  "title-4 rounded-lg px-3 py-2 text-lp-body hover:bg-lp-surface-subtle hover:text-lp-ink",
                  T_HOVER,
                  FOCUS_RING,
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <button
            suppressHydrationWarning
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
              "relative inline-flex h-6 w-12 flex-shrink-0 items-center rounded-full border border-lp-border bg-lp-surface-subtle active:scale-[0.98]",
              T_HOVER,
              FOCUS_RING,
            )}
          >
            <span
              suppressHydrationWarning
              className={cn(
                "pointer-events-none flex size-4 items-center justify-center rounded-full bg-lp-ink text-lp-bg",
                T_MOVE,
              )}
              style={{ transform: isDark ? "translateX(28px)" : "translateX(4px)" }}
            >
              {isDark ? (
                <Sun className="size-3" weight="bold" aria-hidden="true" />
              ) : (
                <Moon className="size-3" weight="bold" aria-hidden="true" />
              )}
            </span>
          </button>

          <LandingButton href="/login" variant="secondary" size="sm" className="hidden md:inline-flex">
            Sign in
          </LandingButton>
          <LandingButton href="/signup" size="sm" className="hidden sm:inline-flex">
            Start free
            <ArrowRight className="size-4" weight="bold" aria-hidden="true" />
          </LandingButton>

          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg text-lp-ink hover:bg-lp-surface-subtle active:scale-[0.98] md:hidden",
              T_HOVER,
              FOCUS_RING,
            )}
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={cn(line, "top-0", T_MOVE, open && "translate-y-[7px] rotate-45")}
              />
              <span className={cn(line, "top-[7px]", T_MOVE, open && "opacity-0")} />
              <span
                className={cn(line, "top-[14px]", T_MOVE, open && "-translate-y-[7px] -rotate-45")}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu: full height panel */}
      <div
        id="mobile-menu"
        inert={!open}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-lp-bg/95 px-6 pb-8 pt-24 backdrop-blur-2xl md:hidden",
          "transition-opacity duration-500",
          EASE_CLASS,
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
          {LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={close}
              style={stagger(i)}
              className={cn(
                "heading-5 rounded-lg px-3 py-3 text-lp-ink hover:bg-lp-surface-subtle",
                itemMotion,
                FOCUS_RING,
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div style={stagger(LINKS.length)} className={itemMotion}>
            <LandingButton href="/login" variant="secondary" onClick={close} className="w-full">
              Sign in
            </LandingButton>
          </div>
          <div style={stagger(LINKS.length + 1)} className={itemMotion}>
            <LandingButton href="/signup" onClick={close} className="w-full">
              Create your free profile
            </LandingButton>
          </div>
        </div>
      </div>
    </>
  );
}

export const Nav = LandingNav;

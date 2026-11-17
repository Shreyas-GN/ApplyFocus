"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { theme, toggle } = useTheme();

  React.useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = cn(
    "rounded-full px-3.5 py-2 font-ui text-sm font-medium transition-colors",
    scrolled ? "text-lp-body hover:text-lp-ink" : "text-white/75 hover:text-white"
  );

  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <div
          className={cn(
            "flex h-14 w-full max-w-5xl items-center justify-between gap-2 rounded-full border px-4 backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300 md:px-6",
            scrolled
              ? "nav-scrolled-bg border-lp-border/60 shadow-[0_4px_24px_rgba(32,33,36,0.08)]"
              : "border-white/15 bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-accent font-ui text-[11px] font-bold tracking-tight text-white transition-transform duration-150 group-hover:scale-105">
              AF
            </span>
            <span className={cn("font-ui text-[16px] font-bold tracking-[-0.02em] transition-colors", scrolled ? "text-lp-ink" : "text-white")}>
              ApplyFocus
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className={linkClass}>Product</a>
            <a href="#how-it-works" className={linkClass}>How it works</a>
            <a href="#faq" className={linkClass}>FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                scrolled
                  ? "text-lp-muted hover:bg-lp-bg hover:text-lp-ink"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              href="/login"
              className={cn(
                "hidden rounded-full px-3.5 py-2 font-ui text-sm font-medium transition-colors sm:inline-block",
                scrolled ? "text-lp-body hover:text-lp-ink" : "text-white/75 hover:text-white"
              )}
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-lp-accent px-3.5 py-2 font-ui text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-lp-accent-hover"
            >
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Get started — it&apos;s free</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    className={cn("h-8 w-8 rounded-full", scrolled ? "text-lp-ink" : "text-white")}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-[280px] flex-col gap-6 bg-lp-surface p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-accent font-ui text-[11px] font-bold text-white">AF</span>
                      <span className="font-ui text-[16px] font-bold tracking-tight text-lp-ink">ApplyFocus</span>
                    </div>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={toggle}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lp-muted hover:bg-lp-bg hover:text-lp-ink"
                    >
                      {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                  </div>

                  <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                    {[
                      { label: "Product", href: "#how-it-works" },
                      { label: "How it works", href: "#how-it-works" },
                      { label: "FAQ", href: "#faq" },
                    ].map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        className="rounded-lg px-3 py-2.5 font-ui text-[15px] font-medium text-lp-body transition-colors hover:bg-lp-bg hover:text-lp-ink"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-auto flex flex-col gap-2.5 border-t border-lp-border pt-6">
                    <Link href="/login" className="w-full rounded-full border border-lp-border px-4 py-2.5 text-center font-ui text-sm font-medium text-lp-ink transition-colors hover:bg-lp-bg">
                      Sign in
                    </Link>
                    <Link href="/signup" className="w-full rounded-full bg-lp-accent px-4 py-2.5 text-center font-ui text-sm font-semibold text-white transition-colors hover:bg-lp-accent-hover">
                      Get started — it&apos;s free
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export const Nav = LandingNav;

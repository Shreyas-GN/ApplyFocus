"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, Menu } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <div
          className={cn(
            "flex h-16 w-full max-w-5xl items-center justify-between gap-2 rounded-full border px-4 backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300 md:px-6",
            scrolled
              ? "border-lp-border/60 bg-lp-surface/90 shadow-[0_8px_32px_rgba(32,33,36,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]"
              : "border-lp-border/40 bg-lp-bg/80 shadow-[0_4px_16px_rgba(32,33,36,0.06)]"
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lp-ink font-ui text-xs font-semibold tracking-tight text-white transition-transform duration-150 group-hover:scale-105">
              AP
            </span>
            <span className="font-ui text-lg font-bold tracking-tight text-lp-ink drop-shadow-none transition-colors">
              ApplyPilot
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {["Product", "How it works", "FAQ"].map((label, i) => {
              const href = i === 2 ? "#faq" : "#how-it-works";
              return (
                <a
                  key={label}
                  href={href}
                  className="rounded-full px-3.5 py-2 font-ui text-sm font-medium text-lp-body transition-colors hover:text-lp-ink"
                >
                  {label}
                </a>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-3.5 py-2 font-ui text-sm font-medium text-lp-body transition-colors hover:text-lp-ink sm:inline-block"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-lp-accent px-4 py-2 font-ui text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-lp-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
            >
              <span className="sm:hidden">Get started</span>
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
                    className="rounded-full text-lp-ink"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-[300px] flex-col gap-6 bg-lp-surface p-6">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lp-ink font-ui text-xs font-semibold text-white">
                      AP
                    </span>
                    <span className="font-ui text-lg font-bold tracking-tight text-lp-ink">
                      ApplyPilot
                    </span>
                  </div>

                  <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
                    <a href="#how-it-works" className="font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink">
                      Product
                    </a>
                    <a href="#how-it-works" className="font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink">
                      How it works
                    </a>
                    <a href="#faq" className="font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink">
                      FAQ
                    </a>
                  </nav>

                  <div className="mt-auto flex flex-col gap-2.5 border-t border-lp-border pt-6">
                    <Link
                      href="/login"
                      className="w-full rounded-full border border-lp-border px-4 py-2.5 text-center font-ui text-sm font-medium text-lp-ink transition-colors hover:bg-lp-bg"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full rounded-full bg-lp-accent px-4 py-2.5 text-center font-ui text-sm font-medium text-white transition-colors hover:bg-lp-accent-hover"
                    >
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

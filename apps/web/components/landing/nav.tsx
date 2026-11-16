"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Layers,
  ArrowRight,
  Menu,
  CheckCircle2,
} from "lucide-react";

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
        {/* Floating Navbar Pill */}
        <div
          className={cn(
            "flex h-16 w-full max-w-5xl items-center justify-between gap-2 rounded-full border px-4 backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300 md:px-6",
            scrolled
              ? "border-white/25 bg-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-neutral-700/40 dark:bg-neutral-900/30"
              : "border-white/15 bg-white/[0.07] shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] dark:border-neutral-800/60 dark:bg-neutral-900/20"
          )}
        >
          {/* Logo Section */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ui-teal font-ui text-xs font-semibold tracking-tight text-white transition-transform duration-150 group-hover:scale-105">
              AP
            </span>
            <span
              className={cn(
                "font-ui text-lg font-bold tracking-tight transition-colors",
                scrolled ? "text-lp-ink dark:text-white" : "text-white drop-shadow-sm"
              )}
            >
              ApplyPilot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavigationMenu
              className={cn(
                "static",
                "[&>div:last-child]:inset-x-0 [&>div:last-child]:top-full [&>div:last-child]:w-full",
                "[&_[data-slot=navigation-menu-viewport]]:mx-auto [&_[data-slot=navigation-menu-viewport]]:-mt-2 [&_[data-slot=navigation-menu-viewport]]:max-w-4xl [&_[data-slot=navigation-menu-viewport]]:ring-0",
                "[&_[data-slot=navigation-menu-viewport]]:rounded-[2rem] [&_[data-slot=navigation-menu-viewport]]:border [&_[data-slot=navigation-menu-viewport]]:border-lp-border dark:[&_[data-slot=navigation-menu-viewport]]:border-neutral-800",
                "[&_[data-slot=navigation-menu-viewport]]:bg-white [&_[data-slot=navigation-menu-viewport]]:shadow-2xl dark:[&_[data-slot=navigation-menu-viewport]]:bg-neutral-950",
                "[&_[data-slot=navigation-menu-viewport]]:transition-all [&_[data-slot=navigation-menu-viewport]]:duration-200 [&_[data-slot=navigation-menu-viewport]]:ease-in-out"
              )}
            >
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="#features"
                      className={cn(
                        "rounded-full bg-transparent px-3.5 py-2 font-ui text-sm font-medium transition-colors",
                        scrolled
                          ? "text-lp-body hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                          : "text-white/80 hover:text-white"
                      )}
                    >
                      Features
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="#resume"
                      className={cn(
                        "flex items-center gap-1.5 rounded-full bg-transparent px-3.5 py-2 font-ui text-sm font-medium transition-colors",
                        scrolled
                          ? "text-lp-body hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                          : "text-white/80 hover:text-white"
                      )}
                    >
                      Resume Engine
                      <Badge
                        variant="secondary"
                        className="h-4 rounded-full bg-ui-teal/15 px-1.5 text-[10px] font-semibold text-ui-teal dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        AI
                      </Badge>
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* Solutions Dropdown Mega Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-auto rounded-full bg-transparent px-3.5 py-2 font-ui text-sm font-medium transition-all focus:bg-transparent",
                      scrolled
                        ? "text-lp-body hover:bg-neutral-100/60 hover:text-lp-ink data-[state=open]:bg-neutral-100/80 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50 dark:data-[state=open]:bg-neutral-800/80"
                        : "text-white/80 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/15"
                    )}
                  >
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="p-0">
                    <div className="grid w-[780px] grid-cols-4 gap-4 divide-x divide-neutral-100 p-6 dark:divide-neutral-900">
                      {/* Column 1: Feature Spotlight */}
                      <div className="flex flex-col pr-2">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ui-teal/10 text-ui-teal dark:bg-neutral-900 dark:text-neutral-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h4 className="mb-1 font-ui text-sm font-semibold text-lp-ink dark:text-neutral-50">
                          Adaptive Resume
                        </h4>
                        <p className="mb-3 font-ui text-xs leading-relaxed text-lp-body dark:text-neutral-400">
                          Precision tailoring for each job without hallucinated claims.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ATS Aligned
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                            <Layers className="h-3 w-3 text-ui-teal" />
                            Provenance
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Core Platform */}
                      <div className="flex flex-col gap-2.5 pl-4">
                        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          Platform
                        </h4>
                        <a
                          href="#features"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Opportunity Radar
                        </a>
                        <a
                          href="#resume"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Resume Engine
                        </a>
                        <a
                          href="#tracking"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Application Tracker
                        </a>
                        <a
                          href="#philosophy"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Our Philosophy
                        </a>
                      </div>

                      {/* Column 3: Use Cases */}
                      <div className="flex flex-col gap-2.5 pl-4">
                        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          Capabilities
                        </h4>
                        <a
                          href="#features"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Candidate Control
                        </a>
                        <a
                          href="#resume"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Smart Autofill
                        </a>
                        <a
                          href="#faq"
                          className="font-ui text-xs font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                        >
                          Frequently Asked
                        </a>
                      </div>

                      {/* Column 4: Quick Action Card */}
                      <div className="flex flex-col pl-4">
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          Featured
                        </h4>
                        <div className="relative flex flex-1 flex-col justify-between rounded-xl border border-ui-teal/20 bg-lp-sand/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
                          <div>
                            <Badge
                              variant="outline"
                              className="mb-2 border-ui-teal/30 bg-white text-[10px] text-ui-teal dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                            >
                              Live Pilot
                            </Badge>
                            <h5 className="font-ui text-xs font-semibold text-lp-ink dark:text-neutral-100">
                              Candidate Copilot
                            </h5>
                            <p className="mt-1 font-ui text-[11px] text-lp-body dark:text-neutral-400">
                              Autofill and track job applications in one click.
                            </p>
                          </div>
                          <Link
                            href="/signup"
                            className="mt-3 inline-flex items-center gap-1 font-ui text-xs font-semibold text-ui-teal hover:underline dark:text-white"
                          >
                            Get started free
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="#tracking"
                      className={cn(
                        "rounded-full bg-transparent px-3.5 py-2 font-ui text-sm font-medium transition-colors",
                        scrolled
                          ? "text-lp-body hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                          : "text-white/80 hover:text-white"
                      )}
                    >
                      Tracking
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <a
                      href="#faq"
                      className={cn(
                        "rounded-full bg-transparent px-3.5 py-2 font-ui text-sm font-medium transition-colors",
                        scrolled
                          ? "text-lp-body hover:text-lp-ink dark:text-neutral-400 dark:hover:text-neutral-50"
                          : "text-white/80 hover:text-white"
                      )}
                    >
                      FAQ
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                "hidden rounded-full px-3.5 py-2 font-ui text-sm font-medium transition-colors sm:inline-block",
                scrolled
                  ? "text-lp-body hover:text-lp-ink dark:text-neutral-300 dark:hover:text-white"
                  : "text-white/80 hover:text-white"
              )}
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-ui-teal px-4 py-2 font-ui text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-ui-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-teal"
            >
              <span className="sm:hidden">Get started</span>
              <span className="hidden sm:inline">Get started — it&apos;s free</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>

            {/* Mobile Sheet Trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    className={cn(
                      "rounded-full",
                      scrolled ? "text-lp-ink dark:text-neutral-200" : "text-white"
                    )}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex w-[320px] flex-col gap-6 p-6 dark:bg-neutral-950"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ui-teal font-ui text-xs font-semibold text-white">
                      AP
                    </span>
                    <span className="font-ui text-lg font-bold tracking-tight text-lp-ink dark:text-white">
                      ApplyPilot
                    </span>
                  </div>

                  <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
                    <a
                      href="#features"
                      className="font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-300 dark:hover:text-white"
                    >
                      Features
                    </a>
                    <a
                      href="#resume"
                      className="flex items-center justify-between font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-300 dark:hover:text-white"
                    >
                      <span>Resume Engine</span>
                      <Badge
                        variant="secondary"
                        className="h-4 rounded-full bg-ui-teal/15 px-1.5 text-[10px] font-semibold text-ui-teal"
                      >
                        AI
                      </Badge>
                    </a>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="solutions" className="border-none">
                        <AccordionTrigger className="py-1 font-ui text-base font-medium text-lp-body hover:no-underline hover:text-lp-ink dark:text-neutral-300 dark:hover:text-white">
                          Solutions
                        </AccordionTrigger>
                        <AccordionContent className="mt-2 ml-2 flex flex-col gap-2.5 border-l border-lp-border pl-4 dark:border-neutral-800">
                          <a
                            href="#features"
                            className="font-ui text-sm text-lp-body hover:text-lp-ink dark:text-neutral-400"
                          >
                            Opportunity Radar
                          </a>
                          <a
                            href="#resume"
                            className="font-ui text-sm text-lp-body hover:text-lp-ink dark:text-neutral-400"
                          >
                            Adaptive Resume
                          </a>
                          <a
                            href="#tracking"
                            className="font-ui text-sm text-lp-body hover:text-lp-ink dark:text-neutral-400"
                          >
                            Application Tracker
                          </a>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <a
                      href="#tracking"
                      className="font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-300 dark:hover:text-white"
                    >
                      Tracking
                    </a>
                    <a
                      href="#faq"
                      className="font-ui text-base font-medium text-lp-body transition-colors hover:text-lp-ink dark:text-neutral-300 dark:hover:text-white"
                    >
                      FAQ
                    </a>
                  </nav>

                  <div className="mt-auto flex flex-col gap-2.5 pt-6 border-t border-lp-border dark:border-neutral-800">
                    <Link
                      href="/login"
                      className="w-full rounded-full border border-lp-border px-4 py-2.5 text-center font-ui text-sm font-medium text-lp-ink transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full rounded-full bg-ui-teal px-4 py-2.5 text-center font-ui text-sm font-medium text-white transition-colors hover:bg-ui-teal-hover"
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

// Export both LandingNav and Nav for backward compatibility
export const Nav = LandingNav;

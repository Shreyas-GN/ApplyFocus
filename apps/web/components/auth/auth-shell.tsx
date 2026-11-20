"use client";

import * as React from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Check, EnvelopeSimple, Eye, EyeSlash, Lock, User } from "@phosphor-icons/react";
import { LogoMark, Wordmark } from "@/components/brand/logo";

export const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

interface AuthShellProps {
  mode: "signup" | "login";
  children: React.ReactNode;
  onGoogleSignIn?: () => void;
  googleLoading?: boolean;
}

export function AuthShell({ mode, children, onGoogleSignIn, googleLoading }: AuthShellProps) {
  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-screen w-full flex-col font-sans text-lp-ink antialiased lg:flex-row bg-lp-bg selection:bg-lp-accent-soft selection:text-lp-accent-ink">
      {/* Left Image & Brand Story Panel */}
      <div className="relative flex min-h-[40vh] w-full flex-col justify-between overflow-hidden bg-[#181818] p-8 text-white sm:p-12 lg:min-h-screen lg:w-1/2">
        {/* Subtle decorative radial tint matching the landing page dark cards */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 20%, rgba(188, 74, 50, 0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(32, 33, 36, 0.8) 0%, transparent 70%)",
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="ApplyFocus Home">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur-md transition-colors group-hover:bg-white/15">
              <LogoMark className="h-full w-full text-white" />
            </div>
            <Wordmark className="h-6 w-auto text-white" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" weight="bold" />
            Back to home
          </Link>
        </div>

        {/* Brand Headline & Value Props */}
        <div className="relative z-10 max-w-lg py-12 lg:py-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
            <span className="size-2 rounded-full bg-lp-accent" aria-hidden="true" />
            Job Search Intelligence
          </div>

          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl xl:text-5xl">
            Know if you fit
            <br />
            <span className="text-[#E58871]">before you apply.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            ApplyFocus maps your skills to each job description with evidence from your own
            experience, so you apply to roles that fit and prepare every application with purpose.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Evidence-backed skill match scoring",
              "ATS-targeted tailored resumes with human control",
              "Job search command center with automated tracking",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-white/90">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lp-accent text-white">
                  <Check className="size-3" weight="bold" />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info on left panel */}
        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} ApplyFocus. Built for purposeful job seekers.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col items-center justify-center bg-lp-bg p-6 sm:p-12 lg:w-1/2">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Header Title */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-lp-ink sm:text-3xl">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-lp-muted">
              {isSignup
                ? "Start mapping your skills to high-fit roles today."
                : "Sign in to continue managing your applications."}
            </p>
          </motion.div>

          {/* Social Sign-in Buttons: Google */}
          {onGoogleSignIn && (
            <motion.div variants={itemVariants} className="mb-6">
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-lp-border bg-lp-surface px-4 py-3 text-sm font-semibold text-lp-ink transition-all hover:bg-lp-surface-subtle hover:border-lp-border/80 focus:outline-none focus:ring-2 focus:ring-lp-accent disabled:opacity-50"
              >
                <GoogleIcon className="size-5" />
                <span>{googleLoading ? "Connecting..." : `Continue with Google`}</span>
              </button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-lp-border" />
                <span className="absolute bg-lp-bg px-3 text-xs uppercase tracking-wider text-lp-muted">
                  Or continue with email
                </span>
              </div>
            </motion.div>
          )}

          {/* Form Content */}
          {children}

          {/* Switch Mode Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-8 text-center text-sm text-lp-muted"
          >
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-lp-accent transition-colors hover:text-lp-accent-hover hover:underline"
                >
                  Log in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-lp-accent transition-colors hover:text-lp-accent-hover hover:underline"
                >
                  Create one for free
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion, type Variants } from "framer-motion";
import { EnvelopeSimple, Eye, EyeSlash, Lock } from "@phosphor-icons/react";
import { registerSchema } from "@applypilot/validators";
import { useAuth } from "@/lib/auth-context";
import { signIn } from "@/lib/auth-client";
import { api, ApiError } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { AuthShell } from "@/components/auth/auth-shell";

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

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to initiate Google sign-in.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = turnstileToken
        ? await register(result.data.email, result.data.password, turnstileToken)
        : await register(result.data.email, result.data.password);
      if (res && res.requiresEmailConfirmation) {
        if (!res.emailSent) {
          setFormError(
            "Your account was created, but we couldn't send the confirmation email. Press \"Resend\" below to try again."
          );
        }
        setPendingConfirmation(true);
        return;
      }
      router.push("/onboarding");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) return;
    setResending(true);
    setResendMessage(null);
    try {
      await api.post("/auth/resend-verification", { email: email.trim() });
      setResendMessage("Confirmation link resent. Check your inbox and spam folder.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not resend confirmation email.");
    } finally {
      setResending(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <AuthShell mode="signup">
        <div className="rounded-xl border border-lp-border bg-lp-surface p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-lp-ink">Check your email</h1>
          <p className="mb-4 text-sm leading-relaxed text-lp-body">
            We sent a confirmation link to <strong className="text-lp-ink">{email}</strong>. Open the link to activate your account and continue onboarding.
          </p>

          {formError && (
            <div className="mb-4">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}

          {resendMessage && (
            <div className="mb-4">
              <Alert tone="success">{resendMessage}</Alert>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="w-full rounded-lg bg-lp-accent py-3 text-sm font-semibold text-white transition-all hover:bg-lp-accent-hover active:scale-[0.98] disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend confirmation email"}
            </button>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-lg border border-lp-border bg-lp-bg py-3 text-sm font-medium text-lp-ink transition-colors hover:bg-lp-surface"
            >
              Back to log in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell mode="signup" onGoogleSignIn={handleGoogleSignIn} googleLoading={googleLoading}>
      {formError && (
        <div className="mb-6">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-lp-ink">
            Work or personal email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-lp-muted">
              <EnvelopeSimple className="size-5" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-lp-border bg-lp-surface py-3.5 pl-11 pr-4 text-sm text-lp-ink placeholder:text-lp-muted focus:border-lp-accent focus:bg-lp-bg focus:outline-none focus:ring-2 focus:ring-lp-accent/20 transition-all"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-lp-error">{fieldErrors.email}</p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-lp-ink">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-lp-muted">
              <Lock className="size-5" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 10 characters"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-lp-border bg-lp-surface py-3.5 pl-11 pr-11 text-sm text-lp-ink placeholder:text-lp-muted focus:border-lp-accent focus:bg-lp-bg focus:outline-none focus:ring-2 focus:ring-lp-accent/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-lp-muted hover:text-lp-ink transition-colors"
              aria-label="Toggle secret visibility"
              title="Toggle visibility"
            >
              {showPassword ? <EyeSlash className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-lp-error">{fieldErrors.password}</p>
          )}
          {!fieldErrors.password && (
            <p className="text-xs text-lp-muted">
              Must be at least 10 characters.
            </p>
          )}
        </motion.div>

        {/* Cloudflare Turnstile */}
        <TurnstileWidget onSuccess={setTurnstileToken} />

        {/* Sign Up Button */}
        <motion.div variants={itemVariants} className="mt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-lp-accent py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lp-accent-hover active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </motion.div>
      </form>

      {/* Terms & Privacy */}
      <motion.p variants={itemVariants} className="mt-6 text-xs leading-relaxed text-lp-muted">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-lp-ink transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-lp-ink transition-colors">
          Privacy Policy
        </Link>
        .
      </motion.p>
    </AuthShell>
  );
}

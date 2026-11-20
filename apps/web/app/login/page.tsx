"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { motion, type Variants } from "framer-motion";
import { EnvelopeSimple, Eye, EyeSlash, Lock } from "@phosphor-icons/react";
import { loginSchema } from "@applypilot/validators";
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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) return;
    const message =
      err === "invalid_or_expired_token"
        ? "Your confirmation link is invalid or has expired. Log in or sign up again to receive a fresh link."
        : params.get("error_description") ?? "Authentication failed. Please try again.";
    queueMicrotask(() => {
      if (!cancelled) setFormError(message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to initiate Google sign-in.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
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
      if (turnstileToken) {
        await login(result.data.email, result.data.password, turnstileToken);
      } else {
        await login(result.data.email, result.data.password);
      }
      try {
        const profile = await api.get<{ fullName: string | null }>("/profile");
        if (!profile.fullName) {
          router.push("/onboarding");
          return;
        }
      } catch {
        // Profile check failed — fall through to dashboard
      }
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.status === 401 ||
          /invalid login credentials/i.test(error.detail)
        ) {
          setFormError("Incorrect email or password.");
        } else if (error.status === 403) {
          setFormError(error.detail);
        } else {
          setFormError(error.detail);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell mode="login" onGoogleSignIn={handleGoogleSignIn} googleLoading={googleLoading}>
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-lp-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-lp-muted hover:text-lp-accent transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-lp-muted">
              <Lock className="size-5" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
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
        </motion.div>

        {/* Cloudflare Turnstile */}
        <TurnstileWidget onSuccess={setTurnstileToken} />

        {/* Sign In Button */}
        <motion.div variants={itemVariants} className="mt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-lp-accent py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lp-accent-hover active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Log in"}
          </button>
        </motion.div>
      </form>
    </AuthShell>
  );
}

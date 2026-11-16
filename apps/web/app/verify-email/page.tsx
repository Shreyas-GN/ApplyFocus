"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? searchParams.get("token_hash") ?? "";
  const [state, setState] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error"
  );
  const [message, setMessage] = useState(
    token
      ? ""
      : "This verification link is missing its token. Check your inbox for your confirmation email."
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    authClient
      .verifyEmail({ query: { token } })
      .then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setState("error");
          setMessage(error.message || "Failed to verify email");
        } else {
          setState("success");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "verifying")
    return <p className="text-sm text-ui-muted">Verifying your email…</p>;
  if (state === "success") {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="success">Your email has been verified. Thanks!</Alert>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-ui-violet hover:underline"
        >
          Continue to dashboard →
        </Link>
      </div>
    );
  }
  return <Alert tone="error">{message}</Alert>;
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 block text-center text-lg font-semibold text-ui-violet"
        >
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-4 text-xl font-semibold text-ui-ink">
            Email Verification
          </h1>
          <Suspense
            fallback={
              <p className="text-sm text-ui-muted">Checking status…</p>
            }
          >
            <VerifyEmailStatus />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

// The emailed link carries a one-time token. We POST it (rather than verifying
// on GET) so link-preview scanners can't consume it. Success also signs the
// user in.
function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"pending" | "ok" | "error">(
    token ? "pending" : "error"
  );
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void (async () => {
      try {
        await api.post("/auth/verify-email", { token });
        await refreshUser();
        setStatus("ok");
      } catch {
        setStatus("error");
      }
    })();
  }, [token, refreshUser]);

  if (status === "pending") {
    return <p className="text-sm text-ui-muted">Verifying your email…</p>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="error">
          This verification link is invalid or has expired. Log in to request a new
          confirmation email.
        </Alert>
        <Link href="/login" className="text-sm font-medium text-ui-teal hover:underline">
          Go to log in →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert tone="success">Your email has been verified. Thanks!</Alert>
      <Link href="/onboarding" className="text-sm font-medium text-ui-teal hover:underline">
        Continue →
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-ui-teal">
          ApplyFocus
        </Link>
        <Card>
          <h1 className="mb-6 text-xl font-semibold text-ui-ink">Email verification</h1>
          <Suspense fallback={null}>
            <VerifyEmailStatus />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

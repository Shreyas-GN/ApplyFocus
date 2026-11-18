"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

// Neon Auth verifies the token server-side when the emailed link is opened,
// then redirects here: with `?error=<CODE>` when the link is invalid/expired,
// otherwise on success.
function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error) {
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
          ApplyPilot
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

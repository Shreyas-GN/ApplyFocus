"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

function ResetPasswordRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  useEffect(() => {
    // Stack Auth handles password reset via /handler/[...stack]
    if (code) {
      router.replace(`/handler/password-reset?code=${code}`);
    } else {
      router.replace("/forgot-password");
    }
  }, [code, router]);

  return <p className="text-sm text-ui-muted">Redirecting…</p>;
}

export default function ResetPasswordPage() {
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
          <h1 className="mb-6 text-xl font-semibold text-ui-ink">
            Choose a new password
          </h1>
          <Suspense fallback={null}>
            <ResetPasswordRedirect />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

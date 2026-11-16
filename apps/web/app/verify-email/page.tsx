"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-ui-violet">
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-6 text-xl font-semibold text-ui-ink">Email verification</h1>
          <Alert tone="success">
            Check your inbox for a verification link. Click the link to confirm your email address.
          </Alert>
          <p className="mt-4 text-center text-sm text-ui-muted">
            <Link href="/login" className="font-medium text-ui-violet hover:underline">
              Back to log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

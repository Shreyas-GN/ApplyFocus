"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { passwordSchema } from "@applypilot/validators";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || linkError) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: result.data,
        token,
      });
      if (resetError) {
        throw new Error(resetError.message);
      }
      setDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "This link may have expired. Request a new one."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">
          Your password has been reset. You can log in now.
        </Alert>
        <Button onClick={() => router.push("/login")}>Go to login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {(!token || linkError) && !error && (
        <Alert tone="error">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Request a new one
          </Link>
          .
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 10 characters."
        required
      />
      <Button type="submit" loading={submitting} className="w-full">
        Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 block text-center text-lg font-semibold text-ui-teal"
        >
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-6 text-xl font-semibold text-ui-ink">
            Choose a new password
          </h1>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

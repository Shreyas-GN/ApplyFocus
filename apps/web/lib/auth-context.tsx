"use client";

import type { AuthUserDto } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useStackApp, useUser } from "@stackframe/stack";
import { ApiError } from "./api-client";

export interface RegisterResult {
  requiresEmailConfirmation: boolean;
}

interface AuthContextValue {
  user: AuthUserDto | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<RegisterResult | void>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stackUser = useUser({ or: "return-null" });
  const app = useStackApp();

  const user: AuthUserDto | null = useMemo(() => {
    if (!stackUser) return null;
    return {
      id: stackUser.id,
      email: stackUser.primaryEmail ?? "",
      emailVerified: stackUser.primaryEmailVerified ?? false,
      createdAt: stackUser.signedUpAt.toISOString(),
    };
  }, [stackUser]);

  const loading = stackUser === undefined;

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await app.signInWithCredential({
        email,
        password,
        noRedirect: true,
      });
      if (result.status === "error") {
        const err = result.error;
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Invalid login credentials.";
        throw new ApiError(401, message);
      }
    },
    [app]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<RegisterResult> => {
      const result = await app.signUpWithCredential({
        email,
        password,
        noRedirect: true,
        verificationCallbackUrl: `${window.location.origin}/auth/confirm?next=/onboarding`,
      });
      if (result.status === "error") {
        const err = result.error;
        if (
          err &&
          typeof err === "object" &&
          "errorCode" in err &&
          (err as { errorCode: string }).errorCode === "USER_WITH_EMAIL_ALREADY_EXISTS"
        ) {
          throw new ApiError(
            409,
            "An account with this email already exists. Try logging in."
          );
        }
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Registration failed. Please try again.";
        throw new ApiError(400, message);
      }
      return { requiresEmailConfirmation: true };
    },
    [app]
  );

  const logout = useCallback(async () => {
    await stackUser?.signOut();
  }, [stackUser]);

  const refreshUser = useCallback(async () => {
    // useUser() is reactive and updates automatically; no-op needed
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

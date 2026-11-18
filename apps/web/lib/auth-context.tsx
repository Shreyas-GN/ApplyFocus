"use client";

import type { AuthUserDto } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { ApiError } from "./api-client";
import { authClient } from "./auth/client";

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

interface SessionUserLike {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
  createdAt?: Date | string | null;
}

function toAuthUserDto(user: SessionUserLike): AuthUserDto {
  const created = user.createdAt ? new Date(user.createdAt) : new Date();
  return {
    id: user.id,
    email: user.email ?? "",
    emailVerified: Boolean(user.emailVerified),
    createdAt: created.toISOString(),
  };
}

interface AuthErrorLike {
  message?: string;
  status?: number;
  code?: string;
}

function toApiError(error: AuthErrorLike, fallbackStatus: number): ApiError {
  return new ApiError(
    error.status || fallbackStatus,
    error.message || "Something went wrong. Please try again."
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();

  const user = useMemo(
    () => (session?.user ? toAuthUserDto(session.user) : null),
    [session]
  );

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        throw toApiError(error, 401);
      }
      await refetch();
    },
    [refetch]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<RegisterResult> => {
      const localPart = email.split("@")[0]?.trim();
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: localPart || email,
        callbackURL: `${window.location.origin}/verify-email`,
      });

      if (error) {
        if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
          throw new ApiError(
            409,
            "An account with this email already exists. Try logging in."
          );
        }
        throw toApiError(error, 400);
      }

      // When email verification is required Neon Auth creates the user but
      // does not start a session (no token) until the link is opened.
      if (data?.token) {
        await refetch();
        return { requiresEmailConfirmation: false };
      }

      return { requiresEmailConfirmation: true };
    },
    [refetch]
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    await refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{ user, loading: isPending, login, register, logout, refreshUser }}
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

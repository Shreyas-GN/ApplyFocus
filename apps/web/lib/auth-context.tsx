"use client";

import type { AuthUserDto } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, setCsrfToken } from "./api-client";

export interface RegisterResult {
  requiresEmailConfirmation: boolean;
  /** False when the account was created but the email could not be sent. */
  emailSent: boolean;
}

interface AuthContextValue {
  user: AuthUserDto | null;
  loading: boolean;
  login(email: string, password: string, turnstileToken?: string): Promise<void>;
  register(email: string, password: string, turnstileToken?: string): Promise<RegisterResult | void>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionPayload {
  user: { id: string; email: string; emailVerified: boolean };
  csrfToken: string;
}

function toAuthUserDto(user: SessionPayload["user"]): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((payload: SessionPayload | null) => {
    setCsrfToken(payload?.csrfToken ?? null);
    setUser(payload ? toAuthUserDto(payload.user) : null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      applySession(await api.get<SessionPayload>("/auth/me"));
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error("Failed to load session:", error);
      }
      applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, turnstileToken?: string) => {
      applySession(
        await api.post<SessionPayload>("/auth/login", { email, password, turnstileToken })
      );
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, turnstileToken?: string): Promise<RegisterResult> => {
      const res = await api.post<
        SessionPayload & { requiresEmailConfirmation?: boolean; emailSent?: boolean }
      >("/auth/signup", {
        email,
        password,
        turnstileToken,
      });

      if (res?.user && res?.csrfToken) {
        applySession({ user: res.user, csrfToken: res.csrfToken });
        return {
          requiresEmailConfirmation: false,
          emailSent: false,
        };
      }

      return {
        requiresEmailConfirmation: res?.requiresEmailConfirmation ?? false,
        emailSent: res?.emailSent !== false,
      };
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

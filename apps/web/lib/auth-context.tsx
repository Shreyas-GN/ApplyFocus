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

interface AuthContextValue {
  user: AuthUserDto | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
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
    async (email: string, password: string) => {
      applySession(await api.post<SessionPayload>("/auth/login", { email, password }));
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      applySession(await api.post<SessionPayload>("/auth/signup", { email, password }));
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

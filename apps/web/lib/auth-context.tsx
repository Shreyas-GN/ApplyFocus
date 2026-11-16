"use client";

import type { AuthUserDto } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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

function toAuthUserDto(user: {
  id: string;
  email: string;
  emailVerified?: boolean | null;
  createdAt?: string | Date;
}): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authClient.getSession();
      if (res.data?.user) {
        setUser(toAuthUserDto(res.data.user));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then((res) => {
        if (!cancelled) {
          if (res.data?.user) {
            setUser(toAuthUserDto(res.data.user));
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        throw new ApiError(401, error.message || "Invalid credentials");
      }
      if (data?.user) {
        setUser(toAuthUserDto(data.user));
      } else {
        await refreshUser();
      }
    },
    [refreshUser]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<RegisterResult> => {
      const name = email.split("@")[0] || "User";
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes("exists") ||
          error.message?.toLowerCase().includes("already")
        ) {
          throw new ApiError(
            409,
            "An account with this email already exists. Try logging in."
          );
        }
        throw new ApiError(400, error.message || "Failed to create account");
      }

      if (data?.user) {
        setUser(toAuthUserDto(data.user));
        return { requiresEmailConfirmation: false };
      }

      await refreshUser();
      return { requiresEmailConfirmation: false };
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

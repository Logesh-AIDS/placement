'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, ApiError, type AuthUser, type UserRole, type DomainType } from '@/lib/api';

// ── Storage keys ──────────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY  = 'pp_access_token';
const REFRESH_TOKEN_KEY = 'pp_refresh_token';
const USER_KEY          = 'pp_user';

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    domain?: DomainType
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // ── Persist helpers ─────────────────────────────────────────────────────────
  const saveSession = (u: AuthUser, at: string, rt: string) => {
    setUser(u);
    setAccessToken(at);
    localStorage.setItem(ACCESS_TOKEN_KEY,  at);
    localStorage.setItem(REFRESH_TOKEN_KEY, rt);
    localStorage.setItem(USER_KEY,          JSON.stringify(u));
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // ── Refresh access token using stored refresh token ─────────────────────────
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefresh) return false;

    try {
      const res = await authApi.refresh(storedRefresh);
      setAccessToken(res.data.accessToken);
      localStorage.setItem(ACCESS_TOKEN_KEY,  res.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, []);

  // ── Rehydrate session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify token is still valid against the backend
        const res = await authApi.me(storedToken);
        setUser(res.data);
        setAccessToken(storedToken);
      } catch (err) {
        // Access token expired — try to refresh
        if (err instanceof ApiError && err.status === 401) {
          const refreshed = await refreshSession();
          if (refreshed) {
            // Re-fetch user with new token
            const newToken = localStorage.getItem(ACCESS_TOKEN_KEY)!;
            try {
              const res = await authApi.me(newToken);
              setUser(res.data);
            } catch {
              clearSession();
            }
          }
        } else {
          clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [refreshSession]);

  // ── Login ────────────────────────────────────────────────────────────────────
  // Throws ApiError on failure — let the form handle the message
  const login = async (email: string, password: string): Promise<void> => {
    const res = await authApi.login(email, password);
    saveSession(res.data.user, res.data.accessToken, res.data.refreshToken);
  };

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    domain?: DomainType
  ): Promise<void> => {
    const res = await authApi.register({ name, email, password, role, domain });
    saveSession(res.data.user, res.data.accessToken, res.data.refreshToken);
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefresh) {
      // Best-effort — don't block logout if the request fails
      authApi.logout(storedRefresh).catch(() => {});
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// Re-export types so consumers don't need to import from two places
export type { AuthUser, UserRole, DomainType };

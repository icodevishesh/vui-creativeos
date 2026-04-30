'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  userType: string;
  roles: string[]; // MemberRole enum values (1-2 roles)
  /** @deprecated use roles[] instead */
  role?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // If the response has no id it's a demo fallback — treat as unauthenticated
        if (data?.id) {
          setUser(data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/sign-in');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Returns a human-readable label for MemberRole enum value(s) */
export function formatRole(role: string | string[] | null, userType: string): string {
  const roles = Array.isArray(role) ? role : (role ? [role] : []);
  if (roles.length === 0) {
    if (userType === 'ADMIN_OWNER') return 'Admin Owner';
    if (userType === 'CLIENT') return 'Client';
    return 'Member';
  }
  return roles
    .map((r) =>
      r.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    )
    .join(' / ');
}

'use client';

/**
 * context/NotificationContext.tsx
 *
 * Provides a live unread-notification count to the entire app.
 * The Header subscribes to `unreadCount` to show the badge.
 *
 * Polling strategy: fetch every 30 seconds (lightweight, no WebSocket needed).
 * On tab focus, refetch immediately so the badge is always fresh.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000; // 30 s

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const res = await fetch('/api/notifications/count', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread ?? 0);
      }
    } catch {
      // silently ignore — badge just stays as-is
    }
  }, [user]);

  // Initial fetch + polling
  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  // Refetch on tab focus
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationCount must be used inside <NotificationProvider>');
  return ctx;
}

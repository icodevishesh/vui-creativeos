'use client';

/**
 * app/notifications/page.tsx
 *
 * Notification Inbox — production-quality, feature-rich UI
 *
 * Features:
 *   - Filter tabs: All / Unread
 *   - Date grouping: Today / Yesterday / Earlier
 *   - Category icons (color-coded by domain)
 *   - Mark single / mark-all-read
 *   - Delete individual notification
 *   - Deep-link to the referenced resource
 *   - Empty state illustrations
 *   - Pagination (load more)
 *   - Live unread badge refresh after mutations
 */

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Circle,
  ClipboardList,
  FileText,
  Folders,
  GitBranch,
  MessageSquare,
  Trash2,
  UserCheck,
  ImageIcon,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useNotificationCount } from '@/context/NotificationContext';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'unread';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  unreadCount: number;
}

// ─── Category helpers ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  TASK_ASSIGNED:            { label: 'Task Assigned',       icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' },
  TASK_COMPLETED:           { label: 'Task Completed',      icon: CheckCheck,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  TASK_INTERNAL_REVIEW:     { label: 'Internal Review',     icon: Circle,        color: 'text-amber-600',  bg: 'bg-amber-50'  },
  TASK_CLIENT_REVIEW:       { label: 'Client Review',       icon: UserCheck,     color: 'text-sky-600',    bg: 'bg-sky-50'    },
  TASK_APPROVED:            { label: 'Task Approved',       icon: CheckCheck,    color: 'text-green-600',  bg: 'bg-green-50'  },
  TASK_FEEDBACK:            { label: 'Feedback Received',   icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
  TASK_REJECT:              { label: 'Task Rejected',       icon: ClipboardList, color: 'text-red-600',    bg: 'bg-red-50'    },
  CLIENT_ONBOARDED:         { label: 'Client Onboarded',    icon: UserCheck,     color: 'text-indigo-600', bg: 'bg-indigo-50' },
  CLIENT_PROJECT:           { label: 'New Project',         icon: Folders,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  CLIENT_SCOPE_OF_WORK:     { label: 'Scope of Work',       icon: FileText,      color: 'text-purple-600', bg: 'bg-purple-50' },
  CLIENT_DOCUMENT_UPLOADED: { label: 'Document Uploaded',   icon: FileText,      color: 'text-teal-600',   bg: 'bg-teal-50'   },
  CLIENT_MEETING_LOGS:      { label: 'Meeting Logged',      icon: MessageSquare, color: 'text-cyan-600',   bg: 'bg-cyan-50'   },
  CLIENT_GANTCHART_CREATION:{ label: 'Gantt Created',       icon: GitBranch,     color: 'text-rose-600',   bg: 'bg-rose-50'   },
  CLIENT_GANTCHART_UPDATE:  { label: 'Gantt Updated',       icon: GitBranch,     color: 'text-pink-600',   bg: 'bg-pink-50'   },
  CREATIVE_UPLOADED:        { label: 'Creative Uploaded',   icon: ImageIcon,     color: 'text-fuchsia-600',bg: 'bg-fuchsia-50'},
  COPYWRITE_FINISHED:       { label: 'Copywrite Finished',  icon: FileText,      color: 'text-lime-600',   bg: 'bg-lime-50'   },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? {
    label: category.replace(/_/g, ' '),
    icon: Bell,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
  };
}

// ─── Date grouping ────────────────────────────────────────────────────────────

function groupByDate(items: NotificationItem[]) {
  const groups: { label: string; items: NotificationItem[] }[] = [];
  const today: NotificationItem[]     = [];
  const yesterday: NotificationItem[] = [];
  const earlier: NotificationItem[]   = [];

  for (const item of items) {
    const d = new Date(item.createdAt);
    if (isToday(d))     today.push(item);
    else if (isYesterday(d)) yesterday.push(item);
    else earlier.push(item);
  }

  if (today.length)     groups.push({ label: 'Today',     items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (earlier.length)   groups.push({ label: 'Earlier',   items: earlier });
  return groups;
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete:   (id: string) => void;
}) {
  const meta = getCategoryMeta(notification.category);
  const Icon = meta.icon;
  const time = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const content = (
    <div
      className={`
        group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200
        ${notification.isRead
          ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
          : 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-200 hover:shadow-md shadow-sm'
        }
      `}
    >
      {/* Category icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${meta.color}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-snug ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.isRead && (
            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1" aria-label="Unread" />
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-[11px] text-gray-400">{time}</span>
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => { e.preventDefault(); onMarkRead(notification.id); }}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(notification.id); }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete notification"
          aria-label="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {notification.link && (
          <span className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <div className="flex flex-col items-center text-center py-24 gap-5">
      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center shadow-inner">
        <Bell className="w-9 h-9 text-gray-300" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-bold text-gray-800">
          {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
        </p>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          {filter === 'unread'
            ? 'You have no unread notifications. Great job staying on top of things!'
            : 'Notifications about tasks, clients, approvals, and team activity will appear here.'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [filter, setFilter]   = useState<FilterType>('all');
  const [page, setPage]       = useState(1);
  const queryClient           = useQueryClient();
  const { refresh: refreshBadge } = useNotificationCount();

  const queryKey = ['notifications', filter, page];

  const { data, isLoading, isFetching, isError, refetch } = useQuery<NotificationsResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/notifications?filter=${filter}&page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to load notifications');
      return res.json();
    },
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    refreshBadge();
  }, [queryClient, refreshBadge]);

  // ── Mark single as read ───────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { invalidate(); toast.success('Marked as read'); },
    onError:   () => toast.error('Failed to update notification'),
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { invalidate(); toast.success('Notification deleted'); },
    onError:   () => toast.error('Failed to delete notification'),
  });

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { invalidate(); toast.success('All notifications marked as read'); },
    onError:   () => toast.error('Failed to mark all as read'),
  });

  const notifications = data?.notifications ?? [];
  const groups        = groupByDate(notifications);
  const unread        = data?.unreadCount ?? 0;
  const totalPages    = data?.pagination.pages ?? 1;
  const hasMore       = page < totalPages;

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {unread > 0 ? `${unread} unread message${unread !== 1 ? 's' : ''}` : 'You\'re all caught up'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Preferences link */}
          <Link
            href="/notifications/preferences"
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </Link>

          {/* Mark all read */}
          {unread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-70"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'unread'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
            {f === 'unread' && unread > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[76px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-16 text-center">
          <p className="text-sm text-red-500 font-semibold">Failed to load notifications.</p>
          <button onClick={() => refetch()} className="mt-3 text-sm text-indigo-600 underline">
            Try again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkRead={(id) => markReadMutation.mutate(id)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                className="px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-all disabled:opacity-60"
              >
                {isFetching ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

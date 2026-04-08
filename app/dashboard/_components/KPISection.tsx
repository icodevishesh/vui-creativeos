'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  activeClients: number;
  openTasks: number;
  pendingApprovals: number;
  delayedProjects: number;
}

interface KPICardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-200 ml-4" />
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({ title, value, subtitle, icon, iconBgColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 mb-0.5">{value}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBgColor}`}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// ─── Section ────────────────────────────────────────────────────────────────

export function KPISection() {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchStats,
  });

  /**
   * Derive card configs from live data.
   * useMemo ensures this only recalculates when data changes,
   * not on every parent re-render.
   */
  const cards = useMemo<KPICardProps[]>(() => {
    if (!data) return [];
    return [
      {
        title: 'Active Clients',
        value: data.activeClients,
        subtitle: 'Currently active',
        icon: <Users className="w-5 h-5 text-blue-600" />,
        iconBgColor: 'bg-blue-50',
      },
      {
        title: 'Open Tasks',
        value: data.openTasks,
        subtitle: 'Across all projects',
        icon: <CheckSquare className="w-5 h-5 text-indigo-600" />,
        iconBgColor: 'bg-indigo-50',
      },
      {
        title: 'Pending Approvals',
        value: data.pendingApprovals,
        subtitle: 'Awaiting review',
        icon: <Clock className="w-5 h-5 text-amber-600" />,
        iconBgColor: 'bg-amber-50',
      },
      {
        title: 'Delayed Projects',
        value: data.delayedProjects,
        subtitle: 'Past end date',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        iconBgColor: 'bg-red-50',
      },
    ];
  }, [data]);

  // Skeleton — same grid structure as real content (no layout shift)
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-red-100 p-5 text-xs text-red-400"
          >
            Failed to load
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  );
}

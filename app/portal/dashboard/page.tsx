'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Building2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PortalDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['portal-approvals'],
    queryFn: async () => {
      const res = await fetch('/api/portal/approvals');
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">Unable to load your profile. Please sign in again.</p>
      </div>
    );
  }

  const pendingCount = (approvals as any[]).length;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    INACTIVE: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, <span className="text-indigo-600">{profile.contactPerson?.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">{profile.companyName} · Client Portal</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Projects</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{profile._count?.projects ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</p>
            <span className={`mt-1 inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${statusColors[profile.status] ?? statusColors.PENDING}`}>
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {/* Pending approvals preview */}
      {pendingCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Items Awaiting Your Review</h2>
            <Link
              href="/portal/approvals"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {approvals.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.project?.name}
                    {task.calendarCopy?.platform && ` · ${task.calendarCopy.platform}`}
                    {task.calendar?.copies?.length ? ` · ${task.calendar.copies.length} copies` : ''}
                  </p>
                </div>
                <Link
                  href="/portal/approvals"
                  className="shrink-0 ml-4 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {profile.services?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Your Services</h2>
          <div className="flex flex-wrap gap-2">
            {profile.services.map((s: any) => (
              <span key={s.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">
                {s.service.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

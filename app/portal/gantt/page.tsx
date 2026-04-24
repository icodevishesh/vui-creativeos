'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import '@svar-ui/react-gantt/all.css';

import GanttChart from '@/components/GanttChart';
import { ProjectSelector } from '@/components/gantt/ProjectSelector';

export default function PortalGanttPage() {
  const [projectId, setProjectId] = useState<string | null>(null);

  // Fetch client profile to get the clientId scoping this view
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json() as Promise<{ id: string; companyName: string; createdAt: string }>;
    },
    staleTime: 60_000,
  });

  const handleApiReady = useCallback(() => {}, []);

  return (
    <div className="flex flex-col gap-4 w-full" style={{ height: 'calc(100vh - 96px)' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Gantt Chart</h1>
          <p className="text-sm text-gray-400">Your project timeline</p>
        </div>

        {/* Toolbar row */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            {profileLoading ? (
              <div className="h-9 w-52 rounded-lg bg-gray-200 animate-pulse" />
            ) : (
              <ProjectSelector
                value={projectId}
                onChange={setProjectId}
                clientId={profile?.id}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-teal-500 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Summary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Milestone</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gantt Chart ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden min-h-0">
        <GanttChart
          projectId={projectId}
          onApiReady={handleApiReady}
          readOnly={true}
        />
      </div>
    </div>
  );
}

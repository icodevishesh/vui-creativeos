'use client';

import { useMemo } from 'react';
import { ChevronDown, FolderKanban } from 'lucide-react';
import { useGanttProjects } from '@/lib/gantt/hooks';
import type { GanttProject } from '@/lib/gantt/types';

// ---- Skeleton --------------------------------------------------------

function ProjectSelectorSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-5 h-5 rounded bg-gray-200" />
      <div className="h-9 w-52 rounded-lg bg-gray-200" />
    </div>
  );
}

// ---- Component -------------------------------------------------------

interface ProjectSelectorProps {
  value: string | null;
  onChange: (id: string) => void;
  // When set, only projects belonging to this client are shown (no optgroup needed)
  clientId?: string;
}

export function ProjectSelector({ value, onChange, clientId }: ProjectSelectorProps) {
  const { data: projects, isLoading, isError } = useGanttProjects(clientId);

  // Group by client name only when showing all clients (no clientId filter)
  const grouped = useMemo(() => {
    if (!projects) return {};
    if (clientId) {
      // Single client — flatten into one group with empty key (no optgroup rendered)
      return { '': projects };
    }
    return projects.reduce<Record<string, GanttProject[]>>((acc, p) => {
      (acc[p.clientName] ??= []).push(p);
      return acc;
    }, {});
  }, [projects, clientId]);

  const selectedProject = useMemo(
    () => projects?.find((p) => p.id === value),
    [projects, value]
  );

  if (isLoading) return <ProjectSelectorSkeleton />;

  if (isError || !projects?.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <FolderKanban className="w-4 h-4" />
        <span>No projects found</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* <FolderKanban className="w-4 h-4 text-gray-500 shrink-0" /> */}
      <div className="relative">
        <select
          id="gantt-project-selector"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="
            appearance-none h-9 pl-3 pr-8 rounded-lg border border-gray-300 bg-white
            text-sm font-medium text-gray-700 leading-none
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
            hover:border-gray-400 transition-colors cursor-pointer min-w-[200px]
          "
          aria-label="Select project for Gantt chart"
        >
          <option value="" disabled>Select a project…</option>
          {Object.entries(grouped).map(([groupLabel, groupProjects]) =>
            groupLabel
              ? (
                <optgroup key={groupLabel} label={groupLabel}>
                  {groupProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              )
              : groupProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {selectedProject && (
        <span className={`
          text-xs font-medium px-2 py-0.5 rounded-full
          ${selectedProject.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
            selectedProject.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              selectedProject.status === 'ON_HOLD' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'}
        `}>
          {selectedProject.status.replace('_', ' ')}
        </span>
      )}
    </div>
  );
}

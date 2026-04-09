// =====================================================
// Gantt Chart — TanStack Query Hooks
// useMemo/useCallback wrappers + cache invalidation
// =====================================================

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import {
  fetchGanttTasks,
  fetchGanttLinks,
  fetchGanttProjects,
} from './api';
import type { GanttTaskClient, GanttLinkClient, GanttProject } from './types';

// ---- query keys (stable references) ----------------------------------

export const ganttKeys = {
  all: ['gantt'] as const,
  projects: () => [...ganttKeys.all, 'projects'] as const,
  tasks: (projectId: string) => [...ganttKeys.all, 'tasks', projectId] as const,
  links: (projectId: string) => [...ganttKeys.all, 'links', projectId] as const,
};

// ---- project selector ------------------------------------------------

export function useGanttProjects() {
  return useQuery<GanttProject[]>({
    queryKey: ganttKeys.projects(),
    queryFn: fetchGanttProjects,
    staleTime: 5 * 60_000, // projects rarely change mid-session
  });
}

// ---- tasks + links for a project -------------------------------------

export function useGanttTasks(projectId: string | null) {
  return useQuery<GanttTaskClient[]>({
    queryKey: ganttKeys.tasks(projectId ?? ''),
    queryFn: () => fetchGanttTasks(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useGanttLinks(projectId: string | null) {
  return useQuery<GanttLinkClient[]>({
    queryKey: ganttKeys.links(projectId ?? ''),
    queryFn: () => fetchGanttLinks(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

/** Combined hook — returns loading/error state for both in one place */
export function useGanttData(projectId: string | null) {
  const tasks = useGanttTasks(projectId);
  const links = useGanttLinks(projectId);

  const isLoading = tasks.isLoading || links.isLoading;
  const isError = tasks.isError || links.isError;
  const error = tasks.error ?? links.error;

  return { tasks, links, isLoading, isError, error };
}

// ---- cache invalidation after server writes --------------------------

export function useGanttInvalidate() {
  const qc = useQueryClient();

  return useCallback(
    (projectId: string) => {
      qc.invalidateQueries({ queryKey: ganttKeys.tasks(projectId) });
      qc.invalidateQueries({ queryKey: ganttKeys.links(projectId) });
    },
    [qc]
  );
}

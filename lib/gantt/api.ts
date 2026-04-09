// =====================================================
// Gantt Chart — Pure Fetch Functions
// Called by TanStack Query hooks — no side effects
// =====================================================

import type {
  GanttTaskClient,
  GanttLinkClient,
  GanttProject,
  GanttTaskRecord,
  GanttLinkRecord,
} from './types';

// ---- helpers ----------------------------------------------------------

function toDate(v: string | null | undefined): Date | undefined {
  if (!v) return undefined;
  return new Date(v);
}

function taskFromRecord(r: GanttTaskRecord): GanttTaskClient {
  return {
    id: r.id,
    text: r.text,
    start: new Date(r.start),
    end: toDate(r.end ?? undefined),
    duration: r.duration,
    progress: r.progress,
    type: r.type,
    parent: r.parent ?? undefined,
    clientId: r.clientId,
    orderId: r.orderId,
    projectId: r.projectId,
  };
}

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[Gantt API] ${res.status} — ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---- read functions ---------------------------------------------------

export async function fetchGanttTasks(projectId: string): Promise<GanttTaskClient[]> {
  const raw = await apiFetch<GanttTaskRecord[]>(
    `/api/gantt/${encodeURIComponent(projectId)}/tasks`
  );
  return raw.map(taskFromRecord);
}

export async function fetchGanttLinks(projectId: string): Promise<GanttLinkClient[]> {
  return apiFetch<GanttLinkClient[]>(
    `/api/gantt/${encodeURIComponent(projectId)}/links`
  );
}

export async function fetchGanttProjects(): Promise<GanttProject[]> {
  return apiFetch<GanttProject[]>('/api/gantt/projects');
}

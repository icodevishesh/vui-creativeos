// =====================================================
// Gantt Chart — Shared Types
// All interfaces used across API routes, hooks, and components
// =====================================================

export interface GanttTaskRecord {
  id: string;
  text: string;
  start: string; // ISO string from DB
  end?: string | null;
  duration: number;
  progress: number;
  type: string;
  parent?: string | null;
  orderId: number;
  projectId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GanttLinkRecord {
  id: string;
  source: string;
  target: string;
  type: string;
  projectId: string;
  clientId: string;
}

/** Shape returned by GET /api/gantt/tasks and /api/gantt/links (dates as Date objects) */
export interface GanttTaskClient {
  id: string;
  text: string;
  start: Date;
  end?: Date;
  duration: number;
  progress: number;
  type: string;
  parent?: string;
  orderId: number;
  projectId: string;
  clientId: string;
}

export interface GanttLinkClient {
  id: string;
  source: string;
  target: string;
  type: string;
  projectId: string;
  clientId: string;
}

/** Shape of POST body when creating a new task */
export interface CreateGanttTaskBody {
  text?: string;
  start?: string;
  end?: string;
  duration?: number;
  progress?: number;
  type?: string;
  parent?: string;
  projectId: string;
  mode?: 'before' | 'after' | 'child';
  target?: string;
  orderId?: number;
}

/** Shape of PUT body when updating a task */
export interface UpdateGanttTaskBody {
  text?: string;
  start?: string;
  end?: string;
  duration?: number;
  progress?: number;
  type?: string;
  parent?: string;
  orderId?: number;
  // Reorder operation fields
  operation?: 'move';
  mode?: 'before' | 'after' | 'child';
  target?: string;
}

/** Shape of POST body when creating a link */
export interface CreateGanttLinkBody {
  source: string;
  target: string;
  type: string;
  projectId: string;
}

/** Project list item for the project selector / Gantt context */
export interface GanttProject {
  id: string;
  name: string;
  status: string;
  clientId: string;
  clientName: string;
  clientIndustry: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
}

/** Shape of POST body when creating a project linked to a client */
export interface CreateProjectBody {
  name: string;
  clientId: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

/** Lightweight client item for the project-creation client selector */
export interface GanttClientItem {
  id: string;
  companyName: string;
  industry: string;
  status: string;
}

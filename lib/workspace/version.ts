export type VersionEntry = {
  version: string;
  title: string;
  description: string | null;
  status: string;
  feedbacks: string[];
  createdAt: Date;
  reviewerName: string | null;
  reviewerType: string | null;
  assignedTo: { id: string; name: string } | null;
};

type SubTaskLike = {
  title: string;
  description: string | null;
  status: string;
  feedbacks: string[];
  createdAt: Date;
  reviewerName?: string | null;
  reviewerType?: string | null;
  assignedTo?: { id: string; name: string } | null;
};

/**
 * Build an ordered version history from a task's subtasks.
 * The original task is implicitly v1; each subtask is v2, v3, ...
 */
export function buildVersionHistory(subtasks: SubTaskLike[]): VersionEntry[] {
  return subtasks.map((st, i) => ({
    version: `v${i + 2}`,
    title: st.title,
    description: st.description,
    status: st.status,
    feedbacks: st.feedbacks,
    createdAt: st.createdAt,
    reviewerName: st.reviewerName ?? null,
    reviewerType: st.reviewerType ?? null,
    assignedTo: st.assignedTo ?? null,
  }));
}

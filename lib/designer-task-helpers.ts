import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { subDays } from 'date-fns';
import { dispatchNotification } from '@/lib/notifications/dispatcher';

// ── Media-type routing constants ────────────────────────────────────────────
export const VIDEO_MEDIA_TYPES = new Set(['VIDEO', 'REEL']);
export const DESIGNER_MEDIA_TYPES = new Set(['IMAGE', 'CAROUSEL', 'TEXT']);

// VIDEO / REEL        → VIDEO_EDITOR
// IMAGE / CAROUSEL / TEXT (and unknown) → GRAPHIC_DESIGNER
export function resolveRoleForMediaType(mediaType: string | null | undefined): 'VIDEO_EDITOR' | 'GRAPHIC_DESIGNER' {
  const upper = mediaType?.toUpperCase() ?? '';
  return VIDEO_MEDIA_TYPES.has(upper) ? 'VIDEO_EDITOR' : 'GRAPHIC_DESIGNER';
}

// ── Team-member resolver ────────────────────────────────────────────────────

interface TeamAssignment {
  assigneeId: string | null;
  role: 'VIDEO_EDITOR' | 'GRAPHIC_DESIGNER';
}

/**
 * Given a clientId and a mediaType, look up the client's team members
 * and return the userId of the appropriate designer/video editor.
 *
 * Uses ClientTeamMember.userRole (the role assigned to this person for
 * this specific client) rather than global User.roles.
 */
export async function resolveAssigneeForCopy(
  clientId: string,
  mediaType: string | null | undefined
): Promise<TeamAssignment> {
  const role = resolveRoleForMediaType(mediaType);

  const normalizeRole = (r: string) => r.toUpperCase().replace(/[\s-]+/g, '_');

  // Only look at team members assigned to this specific client
  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId },
  });

  const match = teamMembers.find(m => normalizeRole(m.userRole) === role);
  return { assigneeId: match?.userId ?? null, role };
}

// ── Single-copy designer task creator ──────────────────────────────────────

interface CopyRef {
  id: string;
  content: string;
  caption?: string | null;
  hashtags?: string | null;
  mediaType?: string | null;
  platforms?: string[];
  publishDate?: Date | null;
  bucketId?: string | null;
}

interface TaskRef {
  id: string;
  title: string;
  priority: string;
  projectId: string;
  clientId: string;
  organizationId: string;
  calendarId: string | null;
}

/**
 * Creates a single designer task for one approved copy.
 * Safe to call multiple times — skips if a designer task already exists
 * for this copy (calendarCopyId uniqueness guard).
 */
export async function createDesignerTaskForCopy(
  copy: CopyRef,
  task: TaskRef
): Promise<void> {
  // Guard: skip if a designer task already exists for this copy
  const existing = await (prisma.task as any).findFirst({
    where: { calendarCopyId: copy.id },
  });
  if (existing) return;

  const { assigneeId } = await resolveAssigneeForCopy(task.clientId, copy.mediaType);

  let deadline: Date | null = null;
  if (copy.publishDate) {
    deadline = subDays(new Date(copy.publishDate), 1);
  }

  const platformLabel = copy.platforms && copy.platforms.length > 0
    ? ` · ${copy.platforms.join(', ')}`
    : '';
  const dateLabel = copy.publishDate
    ? ` (${new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    : '';

  const briefDescription = [
    copy.content,
    copy.caption ? `\nCaption: ${copy.caption}` : '',
    copy.hashtags ? `\nHashtags: ${copy.hashtags}` : '',
    copy.mediaType ? `\nMedia type: ${copy.mediaType}` : '',
  ]
    .filter(Boolean)
    .join('');

  const created = await (prisma.task as any).create({
    data: {
      title: `Design${platformLabel}${dateLabel}`,
      description: briefDescription,
      status: TaskStatus.OPEN,
      priority: task.priority as any,
      mediaUrls: [],
      feedbacks: [],
      projectId: task.projectId,
      clientId: task.clientId,
      organizationId: task.organizationId,
      assignedToId: assigneeId,
      calendarId: task.calendarId,
      calendarCopyId: copy.id,
      contentBucketId: copy.bucketId ?? null,
      startDate: new Date(),
      endDate: deadline,
    },
  });

  // Notify the assigned designer / video editor
  if (assigneeId) {
    dispatchNotification({
      category: 'TASK_ASSIGNED',
      recipientIds: [assigneeId],
      title: 'New task assigned to you',
      message: `You have been assigned "${created.title}" — please review the brief and start working on it.`,
      link: `/tasks/${created.id}`,
    }).catch(err => console.error('[createDesignerTaskForCopy] notify assignee failed:', err));
  }
}

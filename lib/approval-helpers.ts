import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { subDays } from 'date-fns';

interface CalendarTaskRef {
  id: string;
  title: string;
  priority: string;
  projectId: string;
  clientId: string;
  organizationId: string;
  calendarId: string | null;
}

/**
 * When a writer task (linked to a calendar) is approved by the client,
 * create one designer task per CalendarCopy in that calendar.
 *
 * Only processes copies that do NOT already have a designer task linked
 * (calendarCopyId), so re-running after new copies are added never creates
 * duplicates for previously-approved copies.
 */
export async function createDesignerTasksForCalendar(task: CalendarTaskRef) {
  if (!task.calendarId) return;

  const copies = await prisma.calendarCopy.findMany({
    where: { calendarId: task.calendarId },
  });

  if (copies.length === 0) return;

  // Collect copy IDs that already have a designer task to avoid duplicates
  const existingDesignerRows = await (prisma.task as any).findMany({
    where: { calendarId: task.calendarId, calendarCopyId: { not: null } },
    select: { calendarCopyId: true },
  });
  const alreadyHasDesignerTask = new Set<string>(
    existingDesignerRows.map((r: any) => r.calendarCopyId as string)
  );

  // Only process copies that don't have a designer task yet
  const newCopies = copies.filter(c => !alreadyHasDesignerTask.has(c.id));
  if (newCopies.length === 0) return;

  // Fetch team members then look up their global User.roles separately,
  // since ClientTeamMember.userRole is a single-role snapshot that may be stale.
  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId: task.clientId },
  });

  // Build userId → roles[] map from global User records
  const userIds = teamMembers.map(m => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, roles: true },
  });
  const userRolesMap = new Map(users.map(u => [u.id, u.roles as string[]]));

  const normalizeRole = (r: string) => r.toUpperCase().replace(/[\s-]+/g, '_');
  const hasRole = (m: typeof teamMembers[number], role: string) =>
    (userRolesMap.get(m.userId) ?? []).some(r => normalizeRole(r) === role);

  // CREATIVE_LEAD takes priority over GRAPHIC_DESIGNER for non-video copies.
  // If no CREATIVE_LEAD on team, falls through to GRAPHIC_DESIGNER.
  const creativeLeadEntry = teamMembers.find(m => hasRole(m, 'CREATIVE_LEAD'));
  const designerEntry = creativeLeadEntry ?? teamMembers.find(m => hasRole(m, 'GRAPHIC_DESIGNER'));
  const videoEditorEntry = teamMembers.find(m => hasRole(m, 'VIDEO_EDITOR'));

  const VIDEO_MEDIA_TYPES = new Set(['VIDEO', 'REEL', 'VIDEO_AD']);

  for (const copy of newCopies) {
    await prisma.calendarCopy.update({
      where: { id: copy.id },
      data: { status: 'APPROVED' },
    });

    // Route to VIDEO_EDITOR for video/reel copies; GRAPHIC_DESIGNER for everything else.
    // No cross-role fallback — if the required role isn't on the team, leave unassigned.
    const isVideo = copy.mediaType && VIDEO_MEDIA_TYPES.has(copy.mediaType.toUpperCase());
    const assigneeId = isVideo
      ? (videoEditorEntry?.userId ?? null)
      : (designerEntry?.userId ?? null);
    let deadline: Date | null = null;
    if (copy.publishDate) {
      deadline = subDays(new Date(copy.publishDate), 1);
    }

    const platformLabel = copy.platforms && copy.platforms.length > 0 ? ` · ${copy.platforms.join(', ')}` : '';
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

    await (prisma.task as any).create({
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
  }
}

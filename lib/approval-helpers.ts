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

  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId: task.clientId },
  });

  const normalizeRole = (r: string) => r.toUpperCase().replace(/[\s-]+/g, '_');
  const designerEntry = teamMembers.find(m => normalizeRole(m.userRole) === 'GRAPHIC_DESIGNER');
  const videoEditorEntry = teamMembers.find(m => normalizeRole(m.userRole) === 'VIDEO_EDITOR');

  for (const copy of newCopies) {
    await prisma.calendarCopy.update({
      where: { id: copy.id },
      data: { status: 'APPROVED' },
    });

    const assigneeId = designerEntry?.userId ?? videoEditorEntry?.userId ?? null;
    let deadline: Date | null = null;
    if (copy.publishDate) {
      deadline = subDays(new Date(copy.publishDate), 1);
    }

    const platformLabel = copy.platform ? ` · ${copy.platform}` : '';
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
        endDate: deadline,
      },
    });
  }
}

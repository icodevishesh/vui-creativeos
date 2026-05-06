import { prisma } from '@/lib/prisma';
import { createDesignerTaskForCopy } from '@/lib/designer-task-helpers';

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

  for (const copy of copies) {
    await prisma.calendarCopy.update({
      where: { id: copy.id },
      data: { status: 'APPROVED' },
    });
    // createDesignerTaskForCopy guards against duplicates internally
    await createDesignerTaskForCopy(copy as any, task);
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyClientTeamMembers } from '@/lib/notifications/client-notifications';
import { withApiLogging } from '@/lib/api-logging';


type Params = { params: Promise<{ projectId: string; id: string }> };


/**
 * TODO: Add to queue for notification for subtasks
 */

const dateValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const normalizeParent = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === 0 || value === '0' || value === null || value === '') return null;
  return String(value);
};

// PUT /api/gantt/[projectId]/tasks/[id]
export const PUT = withApiLogging(async function PUT(req: Request, { params }: Params) {
  try {
    const { id, projectId } = await params;
    const body = await req.json();

    const task = await prisma.ganttTask.findFirst({
      where: { id, projectId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Move/reorder operations should not create client-facing notifications.
    if (body.operation === 'move') {
      const { mode, target } = body as { mode: 'before' | 'after' | 'child'; target: string };

      if (mode === 'child') {
        const childSiblings = await prisma.ganttTask.findMany({
          where: { projectId, parent: target },
          orderBy: { orderId: 'asc' },
        });
        await prisma.ganttTask.update({
          where: { id },
          data: { parent: target, orderId: childSiblings.length },
        });
      } else {
        const targetTask = await prisma.ganttTask.findUnique({ where: { id: target } });
        if (!targetTask) return NextResponse.json({ error: 'Target not found' }, { status: 404 });

        const newParent = targetTask.parent;
        const newOrderId = mode === 'after' ? targetTask.orderId + 1 : targetTask.orderId;

        await prisma.ganttTask.updateMany({
          where: {
            projectId,
            parent: newParent,
            orderId: { gte: newOrderId },
            id: { not: id },
          },
          data: { orderId: { increment: 1 } },
        });

        await prisma.ganttTask.update({
          where: { id },
          data: { parent: newParent, orderId: newOrderId },
        });
      }

      return NextResponse.json({ id });
    }

    const {
      text,
      start,
      end,
      duration: rawDuration = 1,
      progress: rawProgress = 0,
      type = 'task',
      parent: rawParent,
    } = body;

    const duration = rawDuration !== undefined ? Math.max(1, Math.round(Number(rawDuration))) : undefined;
    const progress = rawProgress !== undefined ? Math.min(1, Math.max(0, Number(rawProgress))) : undefined;
    const parent = normalizeParent(rawParent);

    const hasMeaningfulChange =
      (text !== undefined && text !== task.text) ||
      (start !== undefined && dateValue(start) !== dateValue(task.start)) ||
      (end !== undefined && dateValue(end) !== dateValue(task.end)) ||
      (duration !== undefined && duration !== task.duration) ||
      (progress !== undefined && progress !== task.progress) ||
      (type !== undefined && type !== task.type) ||
      (rawParent !== undefined && parent !== (task.parent ?? null));

    const updated = await prisma.ganttTask.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(start !== undefined && { start: new Date(start) }),
        ...(end !== undefined && { end: end ? new Date(end) : null }),
        ...(duration !== undefined && { duration }),
        ...(progress !== undefined && { progress }),
        ...(type !== undefined && { type }),
        ...(parent !== undefined && { parent }),
      },
    });

    if (hasMeaningfulChange) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, clientId: true, client: { select: { companyName: true } } },
      });

      if (project?.clientId) {
        notifyClientTeamMembers({
          clientId: project.clientId,
          category: 'CLIENT_GANTCHART_UPDATE',
          title: 'Gantt task updated',
          message: `A task was updated in project "${project.name}" for ${project.client.companyName}.`,
          link: `/gantt-chart`,
        }).catch((error) => {
          console.error('[GANTT_TASK_PUT] notifyClientTeamMembers failed:', error);
        });
      }
    }

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error('[GANTT_TASK_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
});

// DELETE /api/gantt/[projectId]/tasks/[id]
export const DELETE = withApiLogging(async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, projectId } = await params;

    await prisma.ganttTask.delete({
      where: { id, projectId },
    });

    return NextResponse.json({});
  } catch (error) {
    console.error('[GANTT_TASK_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
});

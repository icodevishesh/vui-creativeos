/**
 * TODO: Add to queue for notification for subtasks
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchNotification } from '@/lib/notifications/dispatcher';

type Params = { params: Promise<{ projectId: string }> };

// GET /api/gantt/[projectId]/tasks
export async function GET(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;

    const tasks = await prisma.ganttTask.findMany({
      where: { projectId },
      orderBy: { orderId: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[GANTT_TASKS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/gantt/[projectId]/tasks
export async function POST(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const {
      text = 'New Task',
      start,
      end,
      duration: rawDuration = 1,
      progress: rawProgress = 0,
      type = 'task',
      parent: rawParent,
      mode,
      target,
    } = body;

    // Sanitize inputs
    const duration = Math.max(1, Math.round(Number(rawDuration)));
    const progress = Math.min(1, Math.max(0, Number(rawProgress)));
    const parent = (rawParent === 0 || rawParent === '0') ? null : (rawParent || null);

    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      select: { clientId: true }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate orderId based on insertion mode
    let orderId = 0;
    const siblings = await prisma.ganttTask.findMany({
      where: { projectId, parent: parent ?? null },
      orderBy: { orderId: 'asc' },
    });

    if (mode === 'before' && target) {
      const targetTask = siblings.find((t) => t.id === target);
      orderId = targetTask ? targetTask.orderId : 0;
      await prisma.ganttTask.updateMany({
        where: { projectId, orderId: { gte: orderId } },
        data: { orderId: { increment: 1 } },
      });
    } else if (mode === 'after' && target) {
      const targetTask = siblings.find((t) => t.id === target);
      orderId = targetTask ? targetTask.orderId + 1 : siblings.length;
      await prisma.ganttTask.updateMany({
        where: { projectId, orderId: { gte: orderId } },
        data: { orderId: { increment: 1 } },
      });
    } else if (mode === 'child' && target) {
      const childSiblings = await prisma.ganttTask.findMany({
        where: { projectId, parent: target },
        orderBy: { orderId: 'asc' },
      });
      orderId = childSiblings.length;
    } else {
      orderId = siblings.length;
    }

    const task = await prisma.ganttTask.create({
      data: {
        text,
        start: start ? new Date(start) : new Date(),
        end: end ? new Date(end) : undefined,
        duration,
        progress,
        type,
        parent: mode === 'child' && target ? target : (parent ?? undefined),
        orderId,
        projectId,
        clientId: project.clientId,
      },
    });

    // ── Notify org owner about the new Gantt task ───────────────────
    const fullProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organization: { select: { ownerId: true } }, name: true },
    });
    if (fullProject?.organization?.ownerId) {
      await dispatchNotification({
        category: 'CLIENT_GANTCHART_CREATION',
        recipientIds: [fullProject.organization.ownerId],
        title: 'Gantt task added',
        message: `Task "${text}" was added to project "${fullProject.name}".`,
        link: `/gantt-chart`,
      });
    }

    return NextResponse.json({ id: task.id });
  } catch (error) {
    console.error('[GANTT_TASKS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

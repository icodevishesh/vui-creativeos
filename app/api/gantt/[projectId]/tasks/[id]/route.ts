import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ projectId: string; id: string }> };

// PUT /api/gantt/[projectId]/tasks/[id]
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, projectId } = await params;
    const body = await req.json();

    const task = await prisma.ganttTask.findFirst({ 
      where: { id, projectId } 
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // ── Reorder operation ──────────────────────────────────────────────
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

    // ── Normal update ─────────────────────────────────────────────────
    const { 
      text, 
      start, 
      end, 
      duration: rawDuration = 1,
      progress: rawProgress = 0,
      type = 'task',
      parent: rawParent,
      mode,
      target,
    } = body;

    // Sanitize inputs if provided
    const duration = rawDuration !== undefined ? Math.max(1, Math.round(Number(rawDuration))) : undefined;
    const progress = rawProgress !== undefined ? Math.min(1, Math.max(0, Number(rawProgress))) : undefined;
    const parent = (rawParent === 0 || rawParent === '0') ? null : rawParent;

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

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error('[GANTT_TASK_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/gantt/[projectId]/tasks/[id]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, projectId } = await params;

    await prisma.ganttTask.delete({ 
      where: { id, projectId } 
    });

    return NextResponse.json({});
  } catch (error) {
    console.error('[GANTT_TASK_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

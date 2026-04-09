import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PUT /api/gantt/tasks/:id
// Handles two modes:
//  1. Normal update — { text, start, end, duration, progress, type, parent }
//  2. Move/reorder  — { operation: "move", mode: "before"|"after"|"child", target }
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const task = await prisma.ganttTask.findUnique({ where: { id } });
    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // ── Reorder operation ──────────────────────────────────────────────
    if (body.operation === 'move') {
      const { mode, target } = body as { mode: 'before' | 'after' | 'child'; target: string };

      if (mode === 'child') {
        // Make this task a child of target
        const childSiblings = await prisma.ganttTask.findMany({
          where: { projectId: task.projectId, parent: target },
          orderBy: { orderId: 'asc' },
        });
        await prisma.ganttTask.update({
          where: { id },
          data: { parent: target, orderId: childSiblings.length },
        });
      } else {
        const targetTask = await prisma.ganttTask.findUnique({ where: { id: target } });
        if (!targetTask) return new NextResponse('Target not found', { status: 404 });

        const newParent = targetTask.parent;
        const newOrderId =
          mode === 'after' ? targetTask.orderId + 1 : targetTask.orderId;

        // Shift siblings to make room
        await prisma.ganttTask.updateMany({
          where: {
            projectId: task.projectId,
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
    const { text, start, end, duration, progress, type, parent } = body;

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
    console.error('[GANTT_TASKS_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/gantt/tasks/:id
// Returns {} per RestDataProvider protocol
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.ganttTask.delete({ where: { id } });

    return NextResponse.json({});
  } catch (error) {
    console.error('[GANTT_TASKS_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

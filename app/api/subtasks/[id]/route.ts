import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

/**
 * PATCH /api/subtasks/[id]
 *
 * Update a subtask status (e.g., mark revision as submitted for internal review).
 * Body: { status: string }
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const subtask = await prisma.subTask.findUnique({ where: { id } });
    if (!subtask) {
      return NextResponse.json({ error: 'SubTask not found' }, { status: 404 });
    }

    const updated = await prisma.subTask.update({
      where: { id },
      data: { status: status as TaskStatus },
    });

    // Also update the main task status so it re-enters the review pipeline
    if (status === TaskStatus.INTERNAL_REVIEW) {
      await prisma.task.update({
        where: { id: subtask.mainTaskId },
        data: { status: TaskStatus.INTERNAL_REVIEW },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/subtasks/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

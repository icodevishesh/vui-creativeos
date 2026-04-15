import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isWriter } from '@/lib/workspace/role-gate';
import { buildVersionHistory } from '@/lib/workspace/version';

/**
 * GET /api/workspace/writer
 *
 * Returns tasks assigned to the requesting user, gated to writer roles
 * (COPYWRITER, CONTENT_WRITER). Each task includes a `versionHistory`
 * array derived from its subtasks.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.membership || !isWriter(user.membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden: writer or copywriter role required' },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { assignedToId: user.id },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { id: true, name: true } },
        subTasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            title: true,
            description: true,
            status: true,
            feedbacks: true,
            createdAt: true,
            reviewerName: true,
            reviewerType: true,
            assignedTo: { select: { id: true, name: true } },
          },
        },
        _count: { select: { subTasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = tasks.map((task) => {
      const { subTasks, ...rest } = task;
      return {
        ...rest,
        versionHistory: buildVersionHistory(subTasks),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/workspace/writer]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

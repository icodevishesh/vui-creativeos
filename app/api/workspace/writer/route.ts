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

    const isAdmin = user.userType === 'ADMIN_OWNER' || user.membership?.role === 'ADMIN';
    if (!isAdmin && (!user.membership || !isWriter(user.membership.role))) {
      return NextResponse.json(
        { error: 'Forbidden: writer or copywriter role required' },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: user.id,
        // Exclude fully approved tasks from the workspace
        status: { notIn: ['APPROVED'] as any },
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { id: true, name: true } },
        writerContent: { select: { content: true } },
        subTasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
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
      // Open revision subtasks (for rejected/feedback tasks)
      const revisionSubTasks = subTasks.filter((s) => s.status === 'OPEN');
      return {
        ...rest,
        versionHistory: buildVersionHistory(subTasks),
        revisionSubTasks,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/workspace/writer]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

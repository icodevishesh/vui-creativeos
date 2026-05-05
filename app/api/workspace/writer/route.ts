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

    const memberRoles = user.membership?.roles ?? [];
    const isAdmin = user.userType === 'ADMIN_OWNER' ||
      memberRoles.some((r: string) => ['ADMIN', 'TEAM_LEAD', 'ACCOUNT_MANAGER'].includes(r));
    if (!isAdmin && (!user.membership || !isWriter(user.membership.roles))) {
      return NextResponse.json(
        { error: 'Forbidden: writer or copywriter role required' },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: {
          select: {
            id: true,
            companyName: true,
            scopeOfWork: {
              where: { service: 'SOCIAL_MEDIA' },
              select: { details: true },
            },
          },
        },
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
        calendar: {
          include: {
            _count: {
              select: { copies: true }
            },
            copies: {
              select: { status: true }
            }
          }
        },
        _count: { select: { subTasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = tasks.map((task) => {
      const { subTasks, ...rest } = task;
      // Only surface revision subtasks when the task is OPEN and needs writer action.
      // Once the writer resubmits (INTERNAL_REVIEW) or the task is approved, clear them.
      const revisionSubTasks = task.status === 'OPEN'
        ? subTasks.filter((s) => s.status === 'OPEN')
        : [];

      // Transform calendar count for frontend convenience
      const calCopies = task.calendar?.copies ?? [];
      const transformedCalendar = task.calendar ? {
        ...task.calendar,
        copyCount: task.calendar._count.copies,
        copies: undefined, // strip raw array — not needed by frontend
      } : null;

      // Strict aggregate status: task is only APPROVED when ALL copies are APPROVED/PUBLISHED
      let effectiveStatus = rest.status;
      if (calCopies.length > 0) {
        const allDone = calCopies.every(
          (c) => c.status === 'APPROVED' || c.status === 'PUBLISHED'
        );
        if (!allDone && rest.status === 'APPROVED') {
          effectiveStatus = 'INTERNAL_REVIEW';
        }
      }

      return {
        ...rest,
        status: effectiveStatus,
        calendar: transformedCalendar,
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

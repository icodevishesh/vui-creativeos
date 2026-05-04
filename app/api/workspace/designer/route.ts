import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isDesigner } from '@/lib/workspace/role-gate';
import { buildVersionHistory } from '@/lib/workspace/version';

/**
 * GET /api/workspace/designer
 *
 * Returns tasks assigned to the requesting user, gated to designer roles
 * (GRAPHIC_DESIGNER). Each task includes a `versionHistory` array derived
 * from its subtasks.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.userType === 'ADMIN_OWNER' ||
      (user.membership?.roles ?? []).some((r: string) => ['ADMIN', 'TEAM_LEAD', 'ACCOUNT_MANAGER'].includes(r));
    if (!isAdmin && (!user.membership || !isDesigner(user.membership.roles))) {
      return NextResponse.json(
        { error: 'Forbidden: designer role required' },
        { status: 403 }
      );
    }

    const VIDEO_MEDIA_TYPES = ['VIDEO', 'REEL', 'VIDEO_AD'];
    const normalize = (r: string) => r.toUpperCase().replace(/[\s-]+/g, '_');
    const userRoles: string[] = user.membership?.roles ?? [];
    const isVideoEditor = userRoles.some(r => normalize(r) === 'VIDEO_EDITOR');
    const isTeamLeadOrAM = userRoles.some(
      r => normalize(r) === 'TEAM_LEAD' || normalize(r) === 'ACCOUNT_MANAGER'
    );

    // Role-based media type filter:
    //   VIDEO_EDITOR              → only VIDEO / REEL / VIDEO_AD copies
    //   GRAPHIC_DESIGNER / CREATIVE_LEAD → everything else (IMAGE, CAROUSEL, STATIC, etc.)
    //   ADMIN / TEAM_LEAD / ACCOUNT_MANAGER → see all designer tasks (no filter)
    const mediaTypeFilter = (isAdmin || isTeamLeadOrAM)
      ? {}
      : isVideoEditor
        ? { calendarCopy: { is: { mediaType: { in: VIDEO_MEDIA_TYPES } } } }
        : { calendarCopy: { is: { mediaType: { notIn: VIDEO_MEDIA_TYPES } } } };

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: user.id,
        calendarCopyId: { not: null },
        ...mediaTypeFilter,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { id: true, name: true } },
        designerContent: { select: { notes: true } },
        attachments: { select: { id: true, fileName: true, fileUrl: true, mimeType: true } },
        // Linked copy — provides platforms, publish date, and copy brief
        calendarCopy: {
          select: {
            id: true,
            content: true,
            caption: true,
            platforms: true,
            mediaType: true,
            publishDate: true,
            publishTime: true,
            referenceUrl: true,
            isCarousel: true,
            frameCount: true,
            frames: { orderBy: { frameNumber: 'asc' } },
            status: true,
            bucket: { select: { id: true, name: true } },
          },
        },
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
    console.error('[GET /api/workspace/designer]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

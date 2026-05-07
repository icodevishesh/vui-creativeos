import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MemberRole } from '@prisma/client';

const ADMIN_ROLES = ['ADMIN', 'ADMIN_OWNER'];

async function requireAdmin() {
  const user = await getCurrentUser();
  const isAdmin =
    user?.userType === 'ADMIN_OWNER' ||
    (user?.membership?.roles ?? []).some((role) => ADMIN_ROLES.includes(role));

  if (!user || !isAdmin) {
    return null;
  }

  return user;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const member = await prisma.organizationMember.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.userId === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own member account' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { assignedToId: member.userId },
        data: { assignedToId: null },
      }),
      prisma.task.updateMany({
        where: { writerId: member.userId },
        data: { writerId: null },
      }),
      prisma.task.updateMany({
        where: { editorId: member.userId },
        data: { editorId: null },
      }),
      prisma.task.updateMany({
        where: { designerId: member.userId },
        data: { designerId: null },
      }),
      prisma.task.updateMany({
        where: { videoEditorId: member.userId },
        data: { videoEditorId: null },
      }),
      prisma.subTask.updateMany({
        where: { assignedToId: member.userId },
        data: { assignedToId: null },
      }),
      prisma.project.updateMany({
        where: { createdById: member.userId },
        data: { createdById: null },
      }),
      prisma.projectTeamMember.deleteMany({ where: { userId: member.userId } }),
      prisma.notificationPreference.deleteMany({ where: { userId: member.userId } }),
      prisma.notification.deleteMany({ where: { userId: member.userId } }),
      prisma.organizationMember.deleteMany({ where: { userId: member.userId } }),
      prisma.user.delete({ where: { id: member.userId } }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[MEMBER_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    const member = await prisma.organizationMember.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.userId === user.id && !body.isActive) {
      return NextResponse.json({ error: 'You cannot mark your own member account inactive' }, { status: 400 });
    }

    const updatedMember = await prisma.organizationMember.update({
      where: { id },
      data: { isActive: body.isActive },
      include: {
        user: {
          select: { id: true, name: true, email: true, userType: true },
        },
        customRole: true,
      },
    });

    return NextResponse.json({
      ...updatedMember,
      roles: updatedMember.roles as MemberRole[],
    });
  } catch (error) {
    console.error('[MEMBER_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { notifyClientTeamMembers } from '@/lib/notifications/client-notifications';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await prisma.meetingLog.findMany({
      where: { clientId: id },
      orderBy: { meetingDate: 'desc' },
      include: {
        createdBy: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[CLIENT_MEETINGS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, notes, meetingDate } = body;

    if (!title || !notes || !meetingDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { companyName: true },
    });

    const log = await prisma.meetingLog.create({
      data: {
        clientId: id,
        createdById: currentUser.id,
        title,
        notes,
        meetingDate: new Date(meetingDate),
      },
    });

    await notifyClientTeamMembers({
      clientId: id,
      category: 'CLIENT_MEETING_LOGS',
      title: 'Meeting log added',
      message: `A new meeting log has been added for ${client?.companyName ?? 'this client'}.`,
      link: `/clients/${id}/meetings`,
    }).catch((error) => {
      console.error('[CLIENT_MEETINGS_POST] notifyClientTeamMembers failed:', error);
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('[CLIENT_MEETINGS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { notifyClientTeamMembers } from '@/lib/notifications/client-notifications';
import { withApiLogging } from '@/lib/api-logging';


export const GET = withApiLogging(async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await prisma.clientTeamMember.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('[CLIENT_TEAM_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, userName, userRole } = body;

    if (!userId || !userRole) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validation: one entry per user per client
    const existingMember = await prisma.clientTeamMember.findFirst({
      where: { clientId: id, userId },
    });

    if (existingMember) {
      return new NextResponse(`${existingMember.userName} is already on this client's team`, { status: 400 });
    }

    const member = await prisma.clientTeamMember.create({
      data: {
        clientId: id,
        userId,
        userName: userName || 'Unknown',
        userRole,
      },
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { companyName: true },
    });

    if (client) {
      await notifyClientTeamMembers({
        clientId: id,
        category: 'CLIENT_TEAM_MEMBER_ADDED',
        title: 'Team member added',
        message: `${member.userName} has been added to the client team for ${client.companyName}.`,
        link: `/clients/${id}`,
      }).catch((error) => {
        console.error('[CLIENT_TEAM_POST] notifyClientTeamMembers failed:', error);
      });
    }
    
    return NextResponse.json(member);
  } catch (error) {
    console.error('[CLIENT_TEAM_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
});

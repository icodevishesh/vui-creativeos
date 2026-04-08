import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
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
}

export async function POST(
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

    // Validation: check if role already exists for this client
    const existingRole = await prisma.clientTeamMember.findFirst({
      where: {
        clientId: id,
        userRole: userRole,
      },
    });

    if (existingRole) {
      return new NextResponse(`Role "${userRole}" is already assigned to ${existingRole.userName}`, { status: 400 });
    }

    const member = await prisma.clientTeamMember.create({
      data: {
        clientId: id,
        userId,
        userName: userName || 'Unknown',
        userRole,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('[CLIENT_TEAM_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

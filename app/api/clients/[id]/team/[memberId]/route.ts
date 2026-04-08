import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    await prisma.clientTeamMember.delete({
      where: {
        id: memberId,
        clientId: id, // Ensure we are deleting within context
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CLIENT_TEAM_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

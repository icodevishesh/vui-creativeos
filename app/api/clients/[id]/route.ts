import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        services: true,
        teamMembers: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!client) {
      return new NextResponse('Client not found', { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('[CLIENT_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { onboardingNotes, requirementNotes, competitors, status, industry, socialLinks } = body;

    const client = await prisma.clientProfile.update({
      where: { id },
      data: {
        onboardingNotes,
        requirementNotes,
        competitors,
        status,
        industry,
        socialLinks,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('[CLIENT_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.clientProfile.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CLIENT_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

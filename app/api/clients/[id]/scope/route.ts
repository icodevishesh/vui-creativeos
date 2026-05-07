import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { ServiceType } from '@prisma/client';
import { notifyClientTeamMembers } from '@/lib/notifications/client-notifications';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scope = await prisma.scopeOfWork.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scope);
  } catch (error) {
    console.error('[CLIENT_SCOPE_GET]', error);
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
    const { service, description, budget, details } = body;

    if (!service) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const item = await prisma.$transaction(async (tx) => {
      // Create the scope of work
      const newScope = await tx.scopeOfWork.create({
        data: {
          clientId: id,
          service: service as ServiceType,
          description: description || '',
          budget: budget ? parseFloat(budget) : null,
          details: details || {},
        },
      });

      // Mark the client profile as finalized
      await tx.clientProfile.update({
        where: { id },
        data: { isScopeFinalized: true },
      });

      return newScope;
    });

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      select: { companyName: true },
    });

    await notifyClientTeamMembers({
      clientId: id,
      category: 'CLIENT_SCOPE_OF_WORK',
      title: 'Scope of work updated',
      message: `The scope of work for ${client?.companyName ?? 'this client'} has been updated.`,
      link: `/clients/${id}`,
    }).catch((error) => {
      console.error('[CLIENT_SCOPE_POST] notifyClientTeamMembers failed:', error);
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('[CLIENT_SCOPE_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

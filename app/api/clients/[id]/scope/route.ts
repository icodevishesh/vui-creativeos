import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { ServiceType } from '@prisma/client';

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

    if (!service || !description) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const item = await prisma.scopeOfWork.create({
      data: {
        clientId: id,
        service: service as ServiceType,
        description,
        budget: budget ? parseFloat(budget) : null,
        details: details || {},
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('[CLIENT_SCOPE_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

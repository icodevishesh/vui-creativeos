import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PUT /api/gantt/links/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { source, target, type } = body;

    const link = await prisma.ganttLink.findUnique({ where: { id } });
    if (!link) return new NextResponse('Link not found', { status: 404 });

    const updated = await prisma.ganttLink.update({
      where: { id },
      data: {
        ...(source !== undefined && { source }),
        ...(target !== undefined && { target }),
        ...(type !== undefined && { type }),
      },
    });

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error('[GANTT_LINKS_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/gantt/links/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.ganttLink.delete({ where: { id } });
    return NextResponse.json({});
  } catch (error) {
    console.error('[GANTT_LINKS_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ projectId: string; id: string }> };

// PUT /api/gantt/[projectId]/links/[id]
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, projectId } = await params;
    const body = await req.json();
    const { source, target, type } = body;

    const link = await prisma.ganttLink.findFirst({ 
      where: { id, projectId } 
    });
    
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

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
    console.error('[GANTT_LINK_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/gantt/[projectId]/links/[id]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, projectId } = await params;
    
    await prisma.ganttLink.delete({ 
      where: { id, projectId } 
    });
    
    return NextResponse.json({});
  } catch (error) {
    console.error('[GANTT_LINK_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

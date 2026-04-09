import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ projectId: string }> };

// GET /api/gantt/[projectId]/links
export async function GET(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;

    const links = await prisma.ganttLink.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error('[GANTT_LINKS_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/gantt/[projectId]/links
export async function POST(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { source, target, type = 'e2s' } = body;

    if (!source || !target) {
      return NextResponse.json({ error: 'Missing required fields: source, target' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      select: { clientId: true }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const link = await prisma.ganttLink.create({
      data: { source, target, type, projectId, clientId: project.clientId },
    });

    return NextResponse.json({ id: link.id });
  } catch (error) {
    console.error('[GANTT_LINKS_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

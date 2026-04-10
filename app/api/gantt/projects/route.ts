import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/gantt/projects
// Returns all projects with client name for the project selector
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        description: true,
        startDate: true,
        endDate: true,
        clientId: true,
        createdAt: true,
        client: { 
          select: { 
            companyName: true,
            industry: true
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      description: p.description,
      startDate: p.startDate?.toISOString(),
      endDate: p.endDate?.toISOString(),
      createdAt: p.createdAt.toISOString(),
      clientId: p.clientId,
      clientName: p.client.companyName,
      clientIndustry: p.client.industry,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GANTT_PROJECTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/gantt/projects
// Body: { name, clientId, description?, startDate?, endDate?, budget? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, clientId, description, startDate, endDate, budget } = body;

    if (!name || !clientId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { organizationId: true }
    });

    if (!client) {
      return new NextResponse('Client not found', { status: 404 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        clientId,
        organizationId: client.organizationId,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        status: 'PLANNING',
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('[GANTT_PROJECTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  try {
    if (clientId) {
      // Admin / calendar view: return all calendars for a client with their copies
      const calendars = await prisma.calendar.findMany({
        where: { clientId },
        include: {
          client: { select: { companyName: true } },
          buckets: true,
          copies: { orderBy: { publishDate: 'asc' } },
          _count: { select: { copies: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return NextResponse.json(calendars);
    }

    // Writer view: return only this writer's calendars (include copies so the workspace can render them)
    const calendars = await prisma.calendar.findMany({
      where: { writerId: user.id },
      include: {
        client: { select: { companyName: true } },
        buckets: true,
        copies: { orderBy: { publishDate: 'asc' } },
        _count: { select: { copies: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(calendars);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    let { name, objective, clientId, taskId } = body;

    if (!clientId) {
      // Find the first client if none provided for testing
      const client = await prisma.clientProfile.findFirst();
      if (!client) return NextResponse.json({ error: 'No client found' }, { status: 400 });
      clientId = client.id;
    }

    const calendar = await prisma.calendar.create({
      data: {
        name,
        objective,
        clientId,
        writerId: user.id,
        status: 'DRAFT',
        taskId: taskId // Also stored here for reference
      }
    });

    // Link task to calendar if taskId was provided
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { calendarId: calendar.id }
      });
    }

    return NextResponse.json(calendar);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
  }
}

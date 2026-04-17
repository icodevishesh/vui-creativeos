import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const calendar = await prisma.calendar.findUnique({
      where: { id },
      include: {
        client: { select: { companyName: true } },
        buckets: true,
        copies: {
            orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });

    return NextResponse.json(calendar);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const data = await req.json();
    const calendar = await prisma.calendar.update({
      where: { id },
      data
    });

    return NextResponse.json(calendar);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
  }
}

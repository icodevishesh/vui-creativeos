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
        const copies = await prisma.calendarCopy.findMany({
            where: { calendarId: id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(copies);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch copies' }, { status: 500 });
    }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const data = await req.json();
    
    // Ensure publishDate is a Date object if provided
    if (data.publishDate) {
        data.publishDate = new Date(data.publishDate);
    }

    const copy = await prisma.calendarCopy.create({
      data: {
        ...data,
        calendarId: id,
        status: 'DRAFT'
      }
    });

    return NextResponse.json(copy);
  } catch (error) {
    console.error('Copy API Error:', error);
    return NextResponse.json({ error: 'Failed to add copy' }, { status: 500 });
  }
}

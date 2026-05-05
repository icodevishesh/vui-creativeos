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

    if (data.publishDate) {
      data.publishDate = new Date(data.publishDate);
    }

    // ── Carousel: create parent copy + N frames atomically ──────────────────
    if (data.isCarousel && Array.isArray(data.frames) && data.frames.length >= 2) {
      const { frames, ...copyFields } = data;

      const copy = await prisma.$transaction(async (tx) => {
        const parent = await tx.calendarCopy.create({
          data: {
            ...copyFields,
            calendarId: id,
            status: 'DRAFT',
            isCarousel: true,
            frameCount: frames.length,
          },
        });

        await tx.carouselFrame.createMany({
          data: frames.map((f: { caption?: string; hashtags?: string }, idx: number) => ({
            copyId: parent.id,
            frameNumber: idx + 1,
            caption: f.caption ?? null,
            hashtags: f.hashtags ?? null,
            creativeStatus: 'PENDING',
          })),
        });

        return tx.calendarCopy.findUnique({
          where: { id: parent.id },
          include: { frames: { orderBy: { frameNumber: 'asc' } } },
        });
      });

      return NextResponse.json(copy);
    }

    // ── Non-carousel copy ───────────────────────────────────────────────────
    const copy = await prisma.calendarCopy.create({
      data: { ...data, calendarId: id, status: 'DRAFT', isCarousel: false },
    });

    return NextResponse.json(copy);
  } catch (error) {
    console.error('Copy API Error:', error);
    return NextResponse.json({ error: 'Failed to add copy' }, { status: 500 });
  }
}

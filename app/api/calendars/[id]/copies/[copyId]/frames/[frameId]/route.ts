import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/calendars/[id]/copies/[copyId]/frames/[frameId]
// Designer uploads creativeUrl for a single frame; auto-advances copy when all frames uploaded
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; copyId: string; frameId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { copyId, frameId } = await params;

  try {
    const { creativeUrl } = await req.json();
    if (!creativeUrl) {
      return NextResponse.json({ error: 'creativeUrl is required' }, { status: 400 });
    }

    const frame = await prisma.carouselFrame.update({
      where: { id: frameId },
      data: { creativeUrl, creativeStatus: 'UPLOADED' },
    });

    // Check if ALL frames for this copy are now uploaded
    const allFrames = await prisma.carouselFrame.findMany({
      where: { copyId },
      select: { creativeStatus: true },
    });
    const allUploaded = allFrames.every(f => f.creativeStatus === 'UPLOADED');

    if (allUploaded) {
      // Update the copy's status to reflect all frames uploaded — designer task can then be submitted
      await prisma.calendarCopy.update({
        where: { id: copyId },
        data: { status: 'FRAMES_UPLOADED' },
      });
    }

    return NextResponse.json({ frame, allUploaded });
  } catch (error) {
    console.error('[PATCH frame]', error);
    return NextResponse.json({ error: 'Failed to update frame' }, { status: 500 });
  }
}

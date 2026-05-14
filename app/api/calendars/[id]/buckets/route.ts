import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';


export const POST = withApiLogging(async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { buckets } = await req.json() as { buckets: Array<{ name: string; description?: string }> }; // Array of { name, description }

    // Clear existing buckets if any (or just append)
    // For simplicity in a multi-step form, we might want to replace them if they are all submitted at once
    // But Step 2 shows "Add Content Bucket" button, so we might receive one or all.
    // Based on the screenshot "Next: Create Copies", it likely saves all buckets.

    // Delete existing buckets for this calendar to perform a clean update
    await prisma.calendarBucket.deleteMany({
      where: { calendarId: id }
    });

    const createdBuckets = await Promise.all(
      buckets.map((bucket) =>
        prisma.calendarBucket.create({
          data: {
            ...bucket,
            calendarId: id
          }
        })
      )
    );

    return NextResponse.json(createdBuckets);
  } catch (error) {
    console.error('Bucket API Error:', error);
    return NextResponse.json({ error: 'Failed to add buckets' }, { status: 500 });
  }
});

export const DELETE = withApiLogging(async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({} as { bucketId?: string }));
    const bucketId = body.bucketId;

    if (!bucketId) {
      return NextResponse.json({ error: 'bucketId is required' }, { status: 400 });
    }

    const result = await prisma.calendarBucket.deleteMany({
      where: {
        id: bucketId,
        calendarId: id
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bucket Delete API Error:', error);
    return NextResponse.json({ error: 'Failed to delete bucket' }, { status: 500 });
  }
});

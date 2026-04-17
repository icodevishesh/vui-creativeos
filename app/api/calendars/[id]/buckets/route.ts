import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { buckets } = await req.json(); // Array of { name, description }

    // Clear existing buckets if any (or just append)
    // For simplicity in a multi-step form, we might want to replace them if they are all submitted at once
    // But Step 2 shows "Add Content Bucket" button, so we might receive one or all.
    // Based on the screenshot "Next: Create Copies", it likely saves all buckets.

    // Delete existing buckets for this calendar to perform a clean update
    await prisma.calendarBucket.deleteMany({
      where: { calendarId: id }
    });

    const createdBuckets = await Promise.all(
      buckets.map((bucket: any) =>
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
}

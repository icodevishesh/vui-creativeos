import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface TurnaroundDataPoint {
  week: string;
  days: number;
}

export async function GET() {
  try {
    // Get approvals reviewed in the last 6 weeks
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const approvals = await prisma.approval.findMany({
      where: {
        status: 'APPROVED',
        reviewedAt: { not: null, gte: sixWeeksAgo },
      },
      select: {
        submittedAt: true,
        reviewedAt: true,
      },
    });

    // Group by ISO week (relative label W1..W6)
    const weekMap = new Map<number, { total: number; count: number }>();

    for (const a of approvals) {
      if (!a.reviewedAt) continue;
      const diffMs =
        a.reviewedAt.getTime() - a.submittedAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Determine which of the 6 weeks this falls into (0 = oldest)
      const weekIndex = Math.floor(
        (a.reviewedAt.getTime() - sixWeeksAgo.getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const bucket = Math.min(weekIndex, 5);
      const existing = weekMap.get(bucket);
      if (existing) {
        existing.total += diffDays;
        existing.count += 1;
      } else {
        weekMap.set(bucket, { total: diffDays, count: 1 });
      }
    }

    // Fill all 6 week slots, defaulting to 0 if no data
    const data: TurnaroundDataPoint[] = Array.from({ length: 6 }, (_, i) => {
      const bucket = weekMap.get(i);
      return {
        week: `W${i + 1}`,
        days: bucket
          ? parseFloat((bucket.total / bucket.count).toFixed(1))
          : 0,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[dashboard/turnaround] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch turnaround data' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ProductivityDataPoint {
  name: string;
  tasks: number;
}

export async function GET() {
  try {
    // Get all completed/in-review tasks with their assignees
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ['APPROVED', 'IN_REVIEW'] },
        assignedToId: { not: null },
      },
      select: {
        assignedToId: true,
        assignedTo: {
          select: { name: true },
        },
      },
    });

    // Aggregate task count per user
    const countMap = new Map<string, { name: string; tasks: number }>();
    for (const task of tasks) {
      if (!task.assignedToId || !task.assignedTo) continue;
      const existing = countMap.get(task.assignedToId);
      if (existing) {
        existing.tasks += 1;
      } else {
        // Use first name only for chart legibility
        countMap.set(task.assignedToId, {
          name: task.assignedTo.name.split(' ')[0],
          tasks: 1,
        });
      }
    }

    // Sort descending by task count, take top 8 for readability
    const data: ProductivityDataPoint[] = Array.from(countMap.values())
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 8);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[dashboard/productivity] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch productivity data' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    const [activeClients, openTasks, pendingApprovals, delayedProjects] =
      await Promise.all([
        // Active clients in the system
        prisma.clientProfile.count({
          where: { status: 'ACTIVE' },
        }),

        // Tasks not yet completed
        prisma.task.count({
          where: { status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] } },
        }),

        // Approvals awaiting review
        prisma.approval.count({
          where: { status: 'PENDING' },
        }),

        // Active projects past their end date (overdue)
        prisma.project.count({
          where: {
            status: 'IN_PROGRESS',
            endDate: { lt: now },
          },
        }),
      ]);

    return NextResponse.json({
      activeClients,
      openTasks,
      pendingApprovals,
      delayedProjects,
    });
  } catch (error) {
    console.error('[dashboard/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

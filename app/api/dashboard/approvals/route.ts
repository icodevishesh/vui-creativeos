import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

/**
 * GET /api/dashboard/approvals
 *
 * Calculates client-review approval rate from Task records:
 *   - approved       tasks with status = APPROVED
 *   - rejected       tasks with status = REJECTED
 *   - feedback       tasks that received feedback and returned to OPEN/IN_PROGRESS
 *                    (identified by non-empty feedbacks[] array outside review statuses)
 *   - inReview       tasks currently in CLIENT_REVIEW (still pending, excluded from rate)
 *
 *   approvalRate = (approved / (approved + rejected + feedback)) * 100
 */
export async function GET() {
  try {
    const [approved, rejected, inReview, feedback] = await Promise.all([
      prisma.task.count({
        where: { status: TaskStatus.APPROVED },
      }),
      prisma.task.count({
        where: { status: TaskStatus.REJECTED },
      }),
      prisma.task.count({
        where: { status: TaskStatus.CLIENT_REVIEW },
      }),
      // Tasks that received client feedback and returned to work
      // (feedbacks array is non-empty, status is back to open/in-progress)
      prisma.task.count({
        where: {
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.INTERNAL_REVIEW] },
          feedbacks: { isEmpty: false },
        },
      }),
    ]);

    // Total decided tasks (excludes still-pending CLIENT_REVIEW)
    const total = approved + rejected + feedback;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const rejectedRate = total > 0 ? 100 - approvalRate : 0;

    const data = [
      { name: 'Approved', value: approvalRate, count: approved, color: '#10b981' },
      { name: 'Rejected', value: rejectedRate, count: rejected + feedback, color: '#ef4444' },
    ].filter((d) => d.count > 0);

    return NextResponse.json({
      data,
      approvalRate,
      approved,
      rejected,
      feedback,
      inReview,
      total,
    });
  } catch (error) {
    console.error('[dashboard/approvals] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval data' },
      { status: 500 }
    );
  }
}

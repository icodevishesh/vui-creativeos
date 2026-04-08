import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ApprovalDataPoint {
  name: string;
  value: number;
  color: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Approved', color: '#10b981' },
  PENDING: { label: 'Pending', color: '#f59e0b' },
  REVISION_REQUESTED: { label: 'Revision', color: '#f59e0b' },
  REJECTED: { label: 'Rejected', color: '#ef4444' },
};

export async function GET() {
  try {
    // Count approvals per status
    const approvals = await prisma.approval.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const total = approvals.reduce((sum: number, a: { _count: { _all: number }; status: string }) => sum + a._count._all, 0);

    // Merge PENDING + REVISION_REQUESTED into "Feedback"
    const merged: Record<string, number> = {};
    for (const a of approvals) {
      const key =
        a.status === 'REVISION_REQUESTED' ? 'PENDING' : a.status;
      merged[key] = (merged[key] ?? 0) + a._count._all;
    }

    const data: ApprovalDataPoint[] = Object.entries(merged)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name:
          status === 'PENDING'
            ? 'Feedback'
            : (STATUS_CONFIG[status]?.label ?? status),
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        color: STATUS_CONFIG[status]?.color ?? '#6b7280',
      }));

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('[dashboard/approvals] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval data' },
      { status: 500 }
    );
  }
}

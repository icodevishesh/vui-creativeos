import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildApiLogQueryWhere, withApiLogging } from '@/lib/api-logging';
import { getCurrentUser } from '@/lib/auth';

export const GET = withApiLogging(async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== 'ADMIN_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)));
    const cursor = searchParams.get('cursor');
    const where = buildApiLogQueryWhere(searchParams);

    const logs = await prisma.apiLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return NextResponse.json({
      items,
      pageInfo: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error('[API_LOGS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

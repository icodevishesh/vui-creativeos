/**
 * GET  /api/notifications          — paginated list for the current user
 * PATCH /api/notifications         — bulk mark-as-read or mark-all-read
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET /api/notifications
// Query params:
//   page   (default 1)
//   limit  (default 20, max 50)
//   filter (all | unread)   default: all
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const filter = searchParams.get('filter') ?? 'all';     // 'all' | 'unread'
    const skip   = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(filter === 'unread' ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (err) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/notifications
// Body: { markAllRead: true }
//    OR { ids: string[] }
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (body.markAllRead) {
      const result = await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data:  { isRead: true },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await prisma.notification.updateMany({
        where: { id: { in: body.ids }, userId: user.id },
        data:  { isRead: true },
      });
      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/notifications/count
 *
 * Returns the unread notification count for the authenticated user.
 * Lightweight endpoint polled by the Header badge every 30s.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ unread: 0 });

    const unread = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ unread });
  } catch (err) {
    console.error('[GET /api/notifications/count]', err);
    return NextResponse.json({ unread: 0 });
  }
}

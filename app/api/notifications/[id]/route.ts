/**
 * PATCH  /api/notifications/[id]  — mark single notification as read
 * DELETE /api/notifications/[id]  — delete a notification
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// PATCH /api/notifications/[id]
// Body: { isRead: boolean }  (defaults to true)
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Ensure the notification belongs to this user
    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const isRead = body.isRead !== undefined ? Boolean(body.isRead) : true;

    const updated = await prisma.notification.update({
      where: { id },
      data:  { isRead },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/notifications/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/notifications/[id]
// ---------------------------------------------------------------------------
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/notifications/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

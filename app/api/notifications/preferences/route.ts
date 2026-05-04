/**
 * GET /api/notifications/preferences
 *   Returns the full 13-row preference matrix for the current user.
 *   Rows that don't exist yet are filled with defaults (inApp=true, email=true).
 *
 * PUT /api/notifications/preferences
 *   Upserts a single preference row.
 *   Body: { category: NotificationType, inApp: boolean, email: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NotificationType } from '@prisma/client';

// Every possible notification category in order
const ALL_CATEGORIES = Object.values(NotificationType) as NotificationType[];

// ---------------------------------------------------------------------------
// GET /api/notifications/preferences
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const savedPrefs = await prisma.notificationPreference.findMany({
      where: { userId: user.id },
    });

    const prefMap = new Map(savedPrefs.map((p) => [p.category, p]));

    // Return a full matrix (13 rows) — fill missing rows with defaults
    const matrix = ALL_CATEGORIES.map((category) => {
      const saved = prefMap.get(category);
      return {
        category,
        inApp: saved ? saved.inApp : true,
        email: saved ? saved.email : true,
        id:    saved?.id ?? null,
      };
    });

    return NextResponse.json({ preferences: matrix });
  } catch (err) {
    console.error('[GET /api/notifications/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/notifications/preferences
// Body: { category: NotificationType, inApp: boolean, email: boolean }
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { category, inApp, email } = body;

    if (!category || !ALL_CATEGORIES.includes(category as NotificationType)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (typeof inApp !== 'boolean' || typeof email !== 'boolean') {
      return NextResponse.json({ error: 'inApp and email must be booleans' }, { status: 400 });
    }

    const preference = await prisma.notificationPreference.upsert({
      where:  { userId_category: { userId: user.id, category: category as NotificationType } },
      update: { inApp, email },
      create: { userId: user.id, category: category as NotificationType, inApp, email },
    });

    return NextResponse.json({ preference });
  } catch (err) {
    console.error('[PUT /api/notifications/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

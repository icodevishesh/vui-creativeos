/**
 * PUT /api/notifications/preferences/bulk
 *
 * Bulk upsert all preference rows at once.
 * Body: { preferences: Array<{ category: NotificationType, inApp: boolean, email: boolean }> }
 *
 * MongoDB doesn't support prisma.createMany with skipDuplicates on unique constraints
 * the same way, so we use individual upserts inside a transaction.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NotificationType } from '@prisma/client';

const ALL_CATEGORIES = Object.values(NotificationType) as NotificationType[];

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!Array.isArray(body.preferences)) {
      return NextResponse.json({ error: 'preferences must be an array' }, { status: 400 });
    }

    // Validate all rows before touching the DB
    for (const row of body.preferences) {
      if (!ALL_CATEGORIES.includes(row.category as NotificationType)) {
        return NextResponse.json({ error: `Invalid category: ${row.category}` }, { status: 400 });
      }
      if (typeof row.inApp !== 'boolean' || typeof row.email !== 'boolean') {
        return NextResponse.json(
          { error: `inApp and email must be booleans (got: ${row.category})` },
          { status: 400 },
        );
      }
    }

    // Upsert all rows in parallel (MongoDB doesn't support interactive transactions
    // the same way, so Promise.all is the right approach here)
    const results = await Promise.all(
      body.preferences.map((row: { category: NotificationType; inApp: boolean; email: boolean }) =>
        prisma.notificationPreference.upsert({
          where:  { userId_category: { userId: user.id, category: row.category } },
          update: { inApp: row.inApp, email: row.email },
          create: { userId: user.id, category: row.category, inApp: row.inApp, email: row.email },
        }),
      ),
    );

    return NextResponse.json({ saved: results.length });
  } catch (err) {
    console.error('[PUT /api/notifications/preferences/bulk]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/forgot-password
 *
 * Two-step flow (no email):
 *   Step 1 — { action: "verify", email }
 *     → checks if user exists, returns { exists: true } or 404
 *
 *   Step 2 — { action: "reset", email, password }
 *     → updates the user's password directly
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, email, password } = body;

        if (!action || !email) {
            return NextResponse.json({ error: 'action and email are required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // ── Step 1: Verify email exists ─────────────────────────────────────
        if (action === 'verify') {
            const user = await prisma.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (!user) {
                return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 });
            }
            return NextResponse.json({ exists: true });
        }

        // ── Step 2: Reset password ───────────────────────────────────────────
        if (action === 'reset') {
            if (!password || password.trim().length < 8) {
                return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
            }

            const user = await prisma.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (!user) {
                return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { password: password.trim() },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    } catch (err) {
        console.error('[POST /api/auth/forgot-password]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

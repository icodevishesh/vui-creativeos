import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; userType: string };

    if (decoded.userType !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Use Prisma nested relation filter for robust lookup
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { email: user.email },
      include: {
        services: true,
        teamMembers: true,
        _count: { select: { tasks: true, projects: true } },
      },
    });

    if (!clientProfile) {
      // Fallback: search case-insensitively by trying all profiles
      // (handles edge case where email case differs)
      const allProfiles = await prisma.clientProfile.findMany({
        where: {},
        include: {
          services: true,
          teamMembers: true,
          _count: { select: { tasks: true, projects: true } },
        },
      });
      const match = allProfiles.find(
        p => p.email.toLowerCase() === user.email.toLowerCase()
      );
      if (!match) {
        return NextResponse.json({ error: 'Client profile not found for this account' }, { status: 404 });
      }
      return NextResponse.json({ ...match, userId: user.id });
    }

    return NextResponse.json({ ...clientProfile, userId: user.id });
  } catch (err) {
    console.error('[GET /api/portal/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { withApiLogging } from '@/lib/api-logging';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const GET = withApiLogging(async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; userType: string };

    if (decoded.userType !== 'CLIENT' && decoded.userType !== 'CLIENT_MEMBER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let clientProfile = null;

    if (decoded.userType === 'CLIENT') {
      // Use Prisma nested relation filter for robust lookup
      clientProfile = await prisma.clientProfile.findFirst({
        where: { email: user.email },
        include: {
          services: true,
          teamMembers: true,
          _count: { select: { tasks: true, projects: true } },
        },
      });

      if (!clientProfile) {
        // Fallback: search case-insensitively by trying all profiles
        const allProfiles = await prisma.clientProfile.findMany({
          where: {},
          include: {
            services: true,
            teamMembers: true,
            _count: { select: { tasks: true, projects: true } },
          },
        });
        clientProfile = allProfiles.find(
          p => p.email.toLowerCase() === user.email.toLowerCase()
        ) || null;
      }
    } else if (decoded.userType === 'CLIENT_MEMBER') {
      const teamMember = await prisma.clientTeamMember.findFirst({
        where: { userId: user.id },
        include: {
          client: {
            include: {
              services: true,
              teamMembers: true,
              _count: { select: { tasks: true, projects: true } },
            }
          }
        }
      });
      clientProfile = teamMember?.client || null;
    }

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client profile not found for this account' }, { status: 404 });
    }

    return NextResponse.json({ ...clientProfile, userId: user.id });
  } catch (err) {
    console.error('[GET /api/portal/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

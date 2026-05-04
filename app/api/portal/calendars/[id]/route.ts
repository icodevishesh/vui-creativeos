import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

async function getClientUser(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; userType: string };
  if (decoded.userType !== 'CLIENT') return null;
  return prisma.user.findUnique({ where: { id: decoded.userId } });
}

async function resolveClientId(email: string): Promise<string | null> {
  const exact = await prisma.clientProfile.findFirst({ where: { email } });
  if (exact) return exact.id;
  const all = await prisma.clientProfile.findMany({ select: { id: true, email: true } });
  return all.find(p => p.email.toLowerCase() === email.toLowerCase())?.id ?? null;
}

// GET /api/portal/calendars/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientUser = await getClientUser(token);
    if (!clientUser) return NextResponse.json({ error: 'Forbidden — not a client account' }, { status: 403 });

    const clientId = await resolveClientId(clientUser.email);
    if (!clientId) {
      return NextResponse.json({ error: 'No client profile found for this account' }, { status: 404 });
    }

    const { id } = await params;

    const calendar = await prisma.calendar.findUnique({
      where: { id, clientId }, // Ensure client can only access their own calendars
      include: {
        client: { select: { id: true, companyName: true } },
        writer: { select: { id: true, name: true } },
        buckets: { orderBy: { createdAt: 'asc' } },
        copies: {
          include: {
            bucket: { select: { id: true, name: true } },
            frames: { orderBy: { frameNumber: 'asc' } },
          },
          orderBy: { publishDate: 'asc' },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            project: { select: { id: true, name: true } },
            subTasks: {
              orderBy: { createdAt: 'asc' },
              select: { id: true, title: true, description: true, status: true, createdAt: true, reviewerName: true, reviewerType: true },
            },
            _count: { select: { subTasks: true } },
          },
        },
      },
    });

    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });

    return NextResponse.json(calendar);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}

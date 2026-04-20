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

// GET /api/portal/timeline — all tasks for this client (all statuses)
export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientUser = await getClientUser(token);
    if (!clientUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const clientId = await resolveClientId(clientUser.email);
    if (!clientId) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

    const tasks = await prisma.task.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [
        { project: { name: 'asc' } },
        { createdAt: 'asc' },
      ],
    });

    // Attach calendarCopyId to identify designer vs writer tasks
    const rawTasks = await (prisma.task as any).findMany({
      where: { clientId },
      select: { id: true, calendarCopyId: true },
    });
    const copyIdMap: Record<string, string | null> = Object.fromEntries(
      rawTasks.map((t: any) => [t.id, t.calendarCopyId ?? null])
    );

    const result = tasks.map(t => ({
      ...t,
      taskType: copyIdMap[t.id] ? 'DESIGNER' : 'WRITER',
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/portal/timeline]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

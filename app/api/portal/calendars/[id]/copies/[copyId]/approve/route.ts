import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

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

// POST /api/portal/calendars/[id]/copies/[copyId]/approve
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; copyId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientUser = await getClientUser(token);
    if (!clientUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const clientId = await resolveClientId(clientUser.email);
    if (!clientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const { id: calendarId, copyId } = await params;

    // Verify the calendar belongs to this client
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId, clientId },
    });
    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });

    // Update the copy status
    const updatedCopy = await prisma.calendarCopy.update({
      where: { id: copyId, calendarId },
      data: { status: 'APPROVED' },
    });

    // Create a subtask to track the approval
    const relatedTask = await prisma.task.findFirst({
      where: {
        calendarId,
        status: { in: [TaskStatus.CLIENT_REVIEW, TaskStatus.IN_PROGRESS] },
      },
    });

    if (relatedTask) {
      await prisma.subTask.create({
        data: {
          mainTaskId: relatedTask.id,
          projectId: relatedTask.projectId,
          clientId: clientId,
          title: `Copy approved by client`,
          description: `Copy "${updatedCopy.content.slice(0, 50)}..." was approved`,
          status: 'APPROVED',
          reviewerName: clientUser.name || clientUser.email,
          reviewerType: 'CLIENT',
        },
      });

      // Check if all copies are approved
      const allCopies = await prisma.calendarCopy.findMany({
        where: { calendarId },
        select: { status: true },
      });

      const allApproved = allCopies.every(c => c.status === 'APPROVED' || c.status === 'PUBLISHED');
      if (allApproved) {
        await prisma.task.update({
          where: { id: relatedTask.id },
          data: { status: TaskStatus.APPROVED },
        });
      }
    }

    return NextResponse.json(updatedCopy);
  } catch (error) {
    console.error('Error approving copy:', error);
    return NextResponse.json({ error: 'Failed to approve copy' }, { status: 500 });
  }
}

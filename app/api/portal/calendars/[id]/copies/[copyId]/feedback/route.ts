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

// POST /api/portal/calendars/[id]/copies/[copyId]/feedback
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
    const { feedback } = await req.json();

    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }

    // Verify the calendar belongs to this client
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId, clientId },
    });
    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });

    // Update the copy status back to pending
    const updatedCopy = await prisma.calendarCopy.update({
      where: { id: copyId, calendarId },
      data: { status: 'PENDING' },
    });

    // Create a subtask to track the feedback
    const relatedTask = await prisma.task.findFirst({
      where: {
        calendarId,
        status: { in: [TaskStatus.CLIENT_REVIEW, TaskStatus.IN_PROGRESS, TaskStatus.APPROVED] },
      },
    });

    if (relatedTask) {
      await prisma.subTask.create({
        data: {
          mainTaskId: relatedTask.id,
          projectId: relatedTask.projectId,
          clientId: clientId,
          title: `Feedback from client`,
          description: feedback,
          status: 'OPEN',
          reviewerName: clientUser.name || clientUser.email,
          reviewerType: 'CLIENT',
        },
      });

      // If task was approved, move it back to review
      if (relatedTask.status === TaskStatus.APPROVED) {
        await prisma.task.update({
          where: { id: relatedTask.id },
          data: { status: TaskStatus.CLIENT_REVIEW },
        });
      }
    }

    return NextResponse.json(updatedCopy);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

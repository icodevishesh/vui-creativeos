import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { createDesignerTasksForCalendar } from '@/lib/approval-helpers';
import { dispatchNotification } from '@/lib/notifications/dispatcher';
import { withApiLogging } from '@/lib/api-logging';


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

// POST /api/portal/calendars/[id]/approve-all
export const POST = withApiLogging(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientUser = await getClientUser(token);
    if (!clientUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const clientId = await resolveClientId(clientUser.email);
    if (!clientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const { id: calendarId } = await params;

    // Verify the calendar belongs to this client
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId, clientId },
      include: {
        copies: {
          where: {
            status: { in: ['CLIENT_REVIEW', 'IN_PROGRESS', 'PENDING'] },
          },
        },
      },
    });
    if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });

    // Approve all pending copies
    const updatedCopies = await prisma.calendarCopy.updateMany({
      where: {
        calendarId,
        status: { in: ['CLIENT_REVIEW', 'IN_PROGRESS', 'PENDING'] },
      },
      data: { 
        status: 'APPROVED',
        approvedBy: clientUser.name,
        approvedDate: new Date(),
        approverRole: 'CLIENT'
      },
    });

    // Find related task
    const relatedTask = await prisma.task.findFirst({
      where: {
        calendarId,
        status: { in: [TaskStatus.CLIENT_REVIEW, TaskStatus.IN_PROGRESS] },
      },
    });

    if (relatedTask && updatedCopies.count > 0) {
      // Check if all copies are now approved
      const allCopies = await prisma.calendarCopy.findMany({
        where: { calendarId },
        select: { id: true, status: true },
      });

      const allApproved = allCopies.every(c => c.status === 'APPROVED' || c.status === 'PUBLISHED');
      if (allApproved) {
        await prisma.task.update({
          where: { id: relatedTask.id },
          data: { status: TaskStatus.APPROVED },
        });
        // Create designer tasks for all copies, each routed by media type to the right team member
        await createDesignerTasksForCalendar(relatedTask as any);
        // Notify the writer that their task is fully approved
        if (relatedTask.assignedToId) {
          dispatchNotification({
            category: 'TASK_APPROVED',
            recipientIds: [relatedTask.assignedToId],
            title: 'All copies approved',
            message: `All calendar copies for "${relatedTask.title}" have been approved by the client.`,
            link: `/tasks/${relatedTask.id}`,
          }).catch(err => console.error('[portal approve-all] notify TASK_APPROVED failed:', err));
        }
      }
    }

    return NextResponse.json({ approved: updatedCopies.count });
  } catch (error) {
    console.error('Error approving all copies:', error);
    return NextResponse.json({ error: 'Failed to approve all copies' }, { status: 500 });
  }
});

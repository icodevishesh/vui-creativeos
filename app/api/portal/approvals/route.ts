import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { createDesignerTasksForCalendar } from '@/lib/approval-helpers';

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

// GET /api/portal/approvals?status=CLIENT_REVIEW|APPROVED  (default: CLIENT_REVIEW)
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const taskStatus = statusParam === 'APPROVED' ? TaskStatus.APPROVED : TaskStatus.CLIENT_REVIEW;

    // Fetch tasks — calendarCopy omitted from include
    const tasks = await prisma.task.findMany({
      where: { clientId, status: taskStatus },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        calendar: {
          select: {
            id: true, name: true, objective: true,
            copies: {
              select: {
                id: true, content: true, caption: true, hashtags: true,
                platforms: true, mediaType: true, publishDate: true, publishTime: true, status: true,
                bucket: { select: { id: true, name: true } },
              },
              orderBy: { publishDate: 'asc' },
            },
          },
        },
        attachments: {
          select: { id: true, fileName: true, fileUrl: true, mimeType: true, fileSize: true, platform: true, platformType: true },
          orderBy: { uploadedAt: 'asc' },
        },
        _count: { select: { subTasks: true } },
        subTasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, title: true, description: true, status: true, createdAt: true,
            reviewerName: true, reviewerType: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Batch-fetch CalendarCopy records for designer tasks (calendarCopyId is a plain scalar)
    const copyIds = tasks
      .map(t => (t as any).calendarCopyId as string | null)
      .filter((id): id is string => !!id);

    const copies = copyIds.length > 0
      ? await prisma.calendarCopy.findMany({
        where: { id: { in: copyIds } },
        select: {
          id: true, content: true, caption: true, hashtags: true,
          platforms: true, mediaType: true, publishDate: true, publishTime: true,
          bucketId: true,
        },
      })
      : [];

    const copyMap = Object.fromEntries(copies.map(c => [c.id, c]));

    // Attach calendarCopy to each task
    const result = tasks.map(t => ({
      ...t,
      calendarCopyId: (t as any).calendarCopyId ?? null,
      calendarCopy: (t as any).calendarCopyId ? (copyMap[(t as any).calendarCopyId] ?? null) : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/portal/approvals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/portal/approvals — approve / reject / feedback
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientUser = await getClientUser(token);
    if (!clientUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { taskId, action, feedback } = await req.json();
    if (!taskId || !action) {
      return NextResponse.json({ error: 'taskId and action are required' }, { status: 400 });
    }

    const clientId = await resolveClientId(clientUser.email);
    if (!clientId) return NextResponse.json({ error: 'Client profile not found' }, { status: 403 });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true, title: true, status: true, feedbacks: true, countSubTask: true,
        priority: true, projectId: true, clientId: true, organizationId: true,
        assignedToId: true, calendarId: true,
      },
    });

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (task.clientId !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (task.status !== TaskStatus.CLIENT_REVIEW) {
      return NextResponse.json({ error: 'Task is not in CLIENT_REVIEW' }, { status: 400 });
    }

    // Get calendarCopyId separately via raw task select (it's a scalar even if relation isn't generated)
    const rawTask = await (prisma.task as any).findUnique({
      where: { id: taskId },
      select: { calendarCopyId: true },
    });
    const calendarCopyId: string | null = rawTask?.calendarCopyId ?? null;

    const clientProfile = await prisma.clientProfile.findUnique({ where: { id: clientId } });
    const reviewerName = clientProfile?.contactPerson ?? clientUser.name;

    // ─── APPROVE ─────────────────────────────────────────────────────────────
    if (action === 'approve') {
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.APPROVED },
      });

      // Designer task: mark linked copy as PUBLISHED
      if (calendarCopyId) {
        await prisma.calendarCopy.update({
          where: { id: calendarCopyId },
          data: { status: 'PUBLISHED' },
        });
      }

      // Writer task: spawn designer tasks for every calendar copy
      if (!calendarCopyId && task.calendarId) {
        await createDesignerTasksForCalendar(task);
      }

      return NextResponse.json({ success: true, task: updated });
    }

    // ─── REJECT or FEEDBACK ──────────────────────────────────────────────────
    // Both send the task back to OPEN (writer's queue) and create a SubTask as
    // the revision history entry (v2, v3, …).
    if (action === 'reject' || action === 'feedback') {
      if (!feedback) {
        return NextResponse.json({ error: 'Feedback/reason is required' }, { status: 400 });
      }

      const versionNumber = (task.countSubTask ?? 0) + 2;
      const label = action === 'reject' ? 'Client Rejected' : 'Client Feedback';

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.OPEN,
          feedbacks: { push: feedback },
          countSubTask: { increment: 1 },
        },
      });

      await prisma.subTask.create({
        data: {
          title: `v${versionNumber}: ${task.title}`,
          description: `${label} — ${feedback}`,
          status: TaskStatus.OPEN,
          mainTaskId: taskId,
          projectId: task.projectId,
          clientId: task.clientId,
          assignedToId: task.assignedToId || null,
          feedbacks: [feedback],
          reviewerId: clientUser.id,
          reviewerType: 'CLIENT',
          reviewerName,
        },
      });

      return NextResponse.json({ success: true, task: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/portal/approvals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

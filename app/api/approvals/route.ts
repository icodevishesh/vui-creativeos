import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { createDesignerTasksForCalendar } from "@/lib/approval-helpers";

// GET /api/approvals
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status && (status === "INTERNAL_REVIEW" || status === "CLIENT_REVIEW")) {
            where.status = status;
        } else {
            where.status = { in: [TaskStatus.INTERNAL_REVIEW, TaskStatus.CLIENT_REVIEW] };
        }

        // calendarCopy is NOT in generated TaskInclude (stale client) — fetch it separately
        const tasks = await prisma.task.findMany({
            where,
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
                                platform: true, mediaType: true, publishDate: true, publishTime: true,
                                status: true, bucket: { select: { id: true, name: true } },
                            },
                            orderBy: { publishDate: 'asc' },
                        },
                    },
                },
                attachments: {
                    select: { id: true, fileName: true, fileUrl: true, mimeType: true, fileSize: true },
                    orderBy: { uploadedAt: "asc" },
                },
                _count: { select: { subTasks: true } },
                subTasks: {
                    orderBy: { createdAt: "asc" },
                    include: { assignedTo: { select: { id: true, name: true } } },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Batch-fetch CalendarCopy for designer tasks
        const copyIds = tasks
            .map(t => (t as any).calendarCopyId as string | null)
            .filter((id): id is string => !!id);

        const copies = copyIds.length > 0
            ? await prisma.calendarCopy.findMany({
                  where: { id: { in: copyIds } },
                  select: {
                      id: true, content: true, caption: true, hashtags: true,
                      platform: true, mediaType: true, publishDate: true, publishTime: true,
                      bucketId: true,
                  },
              })
            : [];

        const copyMap = Object.fromEntries(copies.map(c => [c.id, c]));
        const result = tasks.map(t => ({
            ...t,
            calendarCopyId: (t as any).calendarCopyId ?? null,
            calendarCopy: (t as any).calendarCopyId ? (copyMap[(t as any).calendarCopyId] ?? null) : null,
        }));

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET /api/approvals]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/approvals
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            taskId,
            action,       // "approve" | "reject" | "feedback"
            feedback,
            reviewerId,
            reviewerType,
            reviewerName,
        } = body;

        if (!taskId || !action) {
            return NextResponse.json(
                { error: "taskId and action are required" },
                { status: 400 }
            );
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                feedbacks: true,
                countSubTask: true,
                priority: true,
                projectId: true,
                clientId: true,
                organizationId: true,
                assignedToId: true,
                calendarId: true,
                calendarCopyId: true,
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // ─── APPROVE ─────────────────────────────────────────────────────────────
        if (action === "approve") {
            // INTERNAL_REVIEW → CLIENT_REVIEW (first stage)
            if (task.status === TaskStatus.INTERNAL_REVIEW) {
                const updated = await prisma.task.update({
                    where: { id: taskId },
                    data: { status: TaskStatus.CLIENT_REVIEW },
                    include: {
                        project: { select: { name: true } },
                        client: { select: { companyName: true } },
                    },
                });
                return NextResponse.json({ success: true, task: updated });
            }

            // CLIENT_REVIEW → APPROVED (final stage)
            if (task.status === TaskStatus.CLIENT_REVIEW) {
                const updated = await prisma.task.update({
                    where: { id: taskId },
                    data: { status: TaskStatus.APPROVED },
                    include: {
                        project: { select: { name: true } },
                        client: { select: { companyName: true } },
                    },
                });

                // ── Designer task: mark the linked copy as PUBLISHED ──────────────
                if (task.calendarCopyId) {
                    await prisma.calendarCopy.update({
                        where: { id: task.calendarCopyId },
                        data: { status: "PUBLISHED" },
                    });
                }

                // ── Writer task: create designer tasks for every copy in the calendar ──
                if (!task.calendarCopyId && task.calendarId) {
                    await createDesignerTasksForCalendar(task);
                }

                return NextResponse.json({ success: true, task: updated });
            }

            return NextResponse.json({ error: "Task is not in a reviewable state" }, { status: 400 });
        }

        // ─── REJECT ───────────────────────────────────────────────────────────────
        if (action === "reject") {
            if (!feedback) {
                return NextResponse.json(
                    { error: "Feedback/reason is required for rejection" },
                    { status: 400 }
                );
            }

            // INTERNAL_REVIEW rejection → back to writer (OPEN)
            // CLIENT_REVIEW rejection → back to writer (OPEN) for revision
            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: TaskStatus.OPEN,
                    feedbacks: { push: feedback },
                    countSubTask: task.countSubTask + 1,
                },
            });

            await prisma.subTask.create({
                data: {
                    title: `Revision: ${task.title}`,
                    description: `Rejected — ${feedback}`,
                    status: TaskStatus.OPEN,
                    mainTaskId: taskId,
                    projectId: task.projectId,
                    clientId: task.clientId,
                    assignedToId: task.assignedToId || null,
                    feedbacks: [feedback],
                    reviewerId: reviewerId || null,
                    reviewerType: reviewerType || null,
                    reviewerName: reviewerName || null,
                },
            });

            return NextResponse.json({ success: true, task: updatedTask });
        }

        // ─── FEEDBACK ─────────────────────────────────────────────────────────────
        if (action === "feedback") {
            if (!feedback) {
                return NextResponse.json(
                    { error: "Feedback text is required" },
                    { status: 400 }
                );
            }

            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: TaskStatus.OPEN,
                    feedbacks: { push: feedback },
                    countSubTask: task.countSubTask + 1,
                },
            });

            await prisma.subTask.create({
                data: {
                    title: `Feedback: ${task.title}`,
                    description: `Feedback — ${feedback}`,
                    status: TaskStatus.OPEN,
                    mainTaskId: taskId,
                    projectId: task.projectId,
                    clientId: task.clientId,
                    assignedToId: task.assignedToId || null,
                    feedbacks: [feedback],
                    reviewerId: reviewerId || null,
                    reviewerType: reviewerType || null,
                    reviewerName: reviewerName || null,
                },
            });

            return NextResponse.json({ success: true, task: updatedTask });
        }

        return NextResponse.json(
            { error: "Invalid action. Must be 'approve', 'reject', or 'feedback'" },
            { status: 400 }
        );
    } catch (err) {
        console.error("[POST /api/approvals]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { subDays } from "date-fns";

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

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
                client: { select: { id: true, companyName: true } },
                assignedTo: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
                calendarCopy: {
                    select: {
                        id: true,
                        content: true,
                        caption: true,
                        hashtags: true,
                        platform: true,
                        mediaType: true,
                        publishDate: true,
                        publishTime: true,
                        bucket: { select: { id: true, name: true } },
                    },
                },
                calendar: {
                    select: {
                        id: true,
                        name: true,
                        objective: true,
                        copies: {
                            select: {
                                id: true,
                                content: true,
                                caption: true,
                                hashtags: true,
                                platform: true,
                                mediaType: true,
                                publishDate: true,
                                publishTime: true,
                                status: true,
                                bucket: { select: { id: true, name: true } },
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
                    include: { assignedTo: { select: { id: true, name: true } } }
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(tasks);
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
                    await _createDesignerTasksForCalendar(task);
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

            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: TaskStatus.REJECTED,
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

// ─── Helper: create one designer task per copy in the calendar ───────────────

async function _createDesignerTasksForCalendar(task: {
    id: string;
    title: string;
    priority: string;
    projectId: string;
    clientId: string;
    organizationId: string;
    calendarId: string | null;
}) {
    if (!task.calendarId) return;

    // All copies in this calendar
    const copies = await prisma.calendarCopy.findMany({
        where: { calendarId: task.calendarId },
    });

    if (copies.length === 0) return;

    // Look up designer and video editor for this client.
    // Normalize stored roles so both "GRAPHIC_DESIGNER" and "Graphic Designer" match.
    const teamMembers = await prisma.clientTeamMember.findMany({
        where: { clientId: task.clientId },
    });

    const normalizeRole = (r: string) => r.toUpperCase().replace(/[\s-]+/g, "_");
    const designerEntry = teamMembers.find(m => normalizeRole(m.userRole) === "GRAPHIC_DESIGNER");
    const videoEditorEntry = teamMembers.find(m => normalizeRole(m.userRole) === "VIDEO_EDITOR");

    for (const copy of copies) {
        // Mark the copy as approved
        await prisma.calendarCopy.update({
            where: { id: copy.id },
            data: { status: "APPROVED" },
        });

        // Determine assignee: prefer designer; fall back to video editor; or leave unassigned
        const assigneeId = designerEntry?.userId ?? videoEditorEntry?.userId ?? null;

        // Deadline = publishDate − 1 day (or task's own endDate if no publishDate)
        let deadline: Date | null = null;
        if (copy.publishDate) {
            deadline = subDays(new Date(copy.publishDate), 1);
        }

        const platformLabel = copy.platform ? ` · ${copy.platform}` : "";
        const dateLabel = copy.publishDate
            ? ` (${new Date(copy.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
            : "";

        const briefDescription = [
            copy.content,
            copy.caption ? `\nCaption: ${copy.caption}` : "",
            copy.hashtags ? `\nHashtags: ${copy.hashtags}` : "",
            copy.mediaType ? `\nMedia type: ${copy.mediaType}` : "",
        ]
            .filter(Boolean)
            .join("");

        await prisma.task.create({
            data: {
                title: `Design${platformLabel}${dateLabel}`,
                description: briefDescription,
                status: TaskStatus.OPEN,
                priority: task.priority as any,
                mediaUrls: [],
                feedbacks: [],
                projectId: task.projectId,
                clientId: task.clientId,
                organizationId: task.organizationId,
                assignedToId: assigneeId,
                calendarId: task.calendarId,
                calendarCopyId: copy.id,
                contentBucketId: copy.bucketId ?? null,
                endDate: deadline,
            },
        });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

// GET /api/approvals
// Fetch tasks that are in INTERNAL_REVIEW or CLIENT_REVIEW status
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // optional filter: INTERNAL_REVIEW or CLIENT_REVIEW

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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/approvals
// Perform an approval action: approve, reject, or feedback
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            taskId,
            action,       // "approve" | "reject" | "feedback"
            feedback,     // feedback/reason text (for reject/feedback)
            reviewerId,   // user ID of the reviewer
            reviewerType, // "CLIENT" | "ADMIN" | "TEAM_LEAD" | "ACCOUNT_MANAGER"
            reviewerName, // name of the reviewer
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
                projectId: true,
                clientId: true,
                assignedToId: true,
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // ─── APPROVE ──────────────────────────────────────────────
        if (action === "approve") {
            const updated = await prisma.task.update({
                where: { id: taskId },
                data: { status: TaskStatus.APPROVED },
                include: {
                    project: { select: { name: true } },
                    client: { select: { companyName: true } },
                },
            });
            return NextResponse.json({ success: true, task: updated });
        }

        // ─── REJECT ───────────────────────────────────────────────
        if (action === "reject") {
            if (!feedback) {
                return NextResponse.json(
                    { error: "Feedback/reason is required for rejection" },
                    { status: 400 }
                );
            }

            // Update main task: set status to REJECTED, add feedback
            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: TaskStatus.REJECTED,
                    feedbacks: { push: feedback },
                    countSubTask: task.countSubTask + 1,
                },
            });

            // Create a subtask for the rejected task
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

        // ─── FEEDBACK ─────────────────────────────────────────────
        if (action === "feedback") {
            if (!feedback) {
                return NextResponse.json(
                    { error: "Feedback text is required" },
                    { status: 400 }
                );
            }

            // Update main task: keep in review but add feedback, increment subtask count
            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: {
                    feedbacks: { push: feedback },
                    countSubTask: task.countSubTask + 1,
                },
            });

            // Create a subtask for the feedback
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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

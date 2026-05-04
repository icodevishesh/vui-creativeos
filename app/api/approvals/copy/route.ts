import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { createDesignerTasksForCalendar } from "@/lib/approval-helpers";

/**
 * PATCH /api/approvals/copy
 *
 * Item-level approval: approve or reject a single CalendarCopy.
 * After updating the copy status, recalculates the parent Task status
 * using strict aggregate logic:
 *   - All copies APPROVED/PUBLISHED → Task = APPROVED
 *   - Any copy not APPROVED/PUBLISHED → Task = IN_PROGRESS (or original review stage)
 *
 * Body: { copyId, taskId, action: "approve" | "reject", feedback?, reviewerId?, reviewerType?, reviewerName? }
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { copyId, taskId, action, feedback, reviewerId, reviewerType, reviewerName } = body;

        if (!copyId || !taskId || !action) {
            return NextResponse.json(
                { error: "copyId, taskId, and action are required" },
                { status: 400 }
            );
        }

        if (action === "reject" && !feedback) {
            return NextResponse.json(
                { error: "Feedback/reason is required for rejection" },
                { status: 400 }
            );
        }

        // Load the copy and its parent task
        const copy = await prisma.calendarCopy.findUnique({
            where: { id: copyId },
            select: { id: true, status: true, calendarId: true },
        });
        if (!copy) {
            return NextResponse.json({ error: "Copy not found" }, { status: 404 });
        }

        const task = await (prisma.task as any).findUnique({
            where: { id: taskId },
            select: {
                id: true, title: true, status: true, feedbacks: true, countSubTask: true,
                priority: true, projectId: true, clientId: true, organizationId: true,
                assignedToId: true, calendarId: true, calendarCopyId: true,
            },
        });
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // ── APPROVE individual copy ──────────────────────────────────────────
        if (action === "approve") {
            // Advance copy status based on current task stage
            const newCopyStatus =
                task.status === TaskStatus.INTERNAL_REVIEW ? "CLIENT_REVIEW" :
                task.status === TaskStatus.CLIENT_REVIEW ? "APPROVED" :
                "APPROVED";

            await prisma.calendarCopy.update({
                where: { id: copyId },
                data: { status: newCopyStatus },
            });

            // Recalculate task status from all sibling copies
            const allCopies = await prisma.calendarCopy.findMany({
                where: { calendarId: copy.calendarId },
                select: { status: true },
            });

            const allApproved = allCopies.every(
                (c) => c.status === "APPROVED" || c.status === "PUBLISHED"
            );

            let newTaskStatus: string = task.status;
            if (allApproved && task.status === TaskStatus.CLIENT_REVIEW) {
                newTaskStatus = TaskStatus.APPROVED;
            } else if (
                task.status === TaskStatus.INTERNAL_REVIEW &&
                allCopies.every((c) => c.status === "CLIENT_REVIEW" || c.status === "APPROVED" || c.status === "PUBLISHED")
            ) {
                newTaskStatus = TaskStatus.CLIENT_REVIEW;
            }

            const updatedTask = await (prisma.task as any).update({
                where: { id: taskId },
                data: { status: newTaskStatus },
            });

            // If task just reached APPROVED, spawn designer tasks
            if (newTaskStatus === TaskStatus.APPROVED && !task.calendarCopyId) {
                await createDesignerTasksForCalendar(task);
            }

            return NextResponse.json({
                success: true,
                copy: { id: copyId, status: newCopyStatus },
                task: { id: taskId, status: newTaskStatus },
                allApproved,
            });
        }

        // ── REJECT individual copy ───────────────────────────────────────────
        if (action === "reject") {
            // Set copy back to DRAFT (rejection loop)
            await prisma.calendarCopy.update({
                where: { id: copyId },
                data: { status: "REJECTED" },
            });

            // Parent task moves to IN_PROGRESS (pulled out of APPROVED/review state)
            const updatedTask = await (prisma.task as any).update({
                where: { id: taskId },
                data: {
                    status: TaskStatus.IN_PROGRESS,
                    feedbacks: { push: feedback },
                    countSubTask: task.countSubTask + 1,
                },
            });

            // Create a revision SubTask for versioning / history
            await prisma.subTask.create({
                data: {
                    title: `Revision: Copy rejected`,
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

            return NextResponse.json({
                success: true,
                copy: { id: copyId, status: "REJECTED" },
                task: { id: taskId, status: TaskStatus.IN_PROGRESS },
            });
        }

        return NextResponse.json(
            { error: "Invalid action. Must be 'approve' or 'reject'" },
            { status: 400 }
        );
    } catch (err) {
        console.error("[PATCH /api/approvals/copy]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

// GET /api/tasks/[id]
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                client: true,
                assignedTo: { select: { id: true, name: true } },
                subTasks: {
                    orderBy: { createdAt: "desc" },
                    include: { assignedTo: { select: { id: true, name: true } } }
                },
                comments: {
                    orderBy: { createdAt: "desc" },
                    include: { author: { select: { id: true, name: true } } }
                },
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (err) {
        console.error("[GET /api/tasks/:id]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/tasks/[id]
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const body = await req.json();
        const {
            title,
            description,
            status,
            priority,
            assignedToId,
            startDate,
            endDate,
            feedbacks,
            mediaUrls,
            newFeedback, // Specifically for adding a new feedback entry
        } = body;

        // Fetch current task state to compare
        const currentTask = await prisma.task.findUnique({
            where: { id },
        });

        if (!currentTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const data: any = {};
        if (title) data.title = title;
        if (description !== undefined) data.description = description;
        if (status) data.status = status;
        if (priority) data.priority = priority;
        if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);
        if (mediaUrls) data.mediaUrls = mediaUrls;

        // Handle feedback logic
        let updatedFeedbacks = feedbacks || currentTask.feedbacks;
        if (newFeedback) {
            updatedFeedbacks = [...updatedFeedbacks, newFeedback];
        }
        data.feedbacks = updatedFeedbacks;

        // Automated behavior: If status is REJECTED or new feedback is added by a reviewer, 
        // increment countSubTask and prepare to show/create subtasks.
        if (status === TaskStatus.REJECTED || (newFeedback && currentTask.status === TaskStatus.CLIENT_REVIEW)) {
            data.countSubTask = currentTask.countSubTask + 1;
        }

        const task = await prisma.task.update({
            where: { id },
            data,
            include: {
                project: true,
                client: true,
                assignedTo: { select: { id: true, name: true } },
                subTasks: true,
            },
        });

        return NextResponse.json(task);
    } catch (err) {
        console.error("[PATCH /api/tasks/:id]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/[id]
export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        await prisma.task.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[DELETE /api/tasks/:id]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

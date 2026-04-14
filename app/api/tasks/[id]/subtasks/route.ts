import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

// POST /api/tasks/[id]/subtasks
// Create a new subtask for a main task
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const body = await req.json();
        const {
            title,
            description,
            assignedToId,
            mediaUrls,
            startDate,
            endDate,
        } = body;

        // Verify main task exists
        const mainTask = await prisma.task.findUnique({
            where: { id },
            select: { id: true, projectId: true, clientId: true, organizationId: true }
        });

        if (!mainTask) {
            return NextResponse.json({ error: "Main task not found" }, { status: 404 });
        }

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const subTask = await prisma.subTask.create({
            data: {
                title,
                description,
                status: TaskStatus.OPEN,
                mainTaskId: id,
                projectId: mainTask.projectId,
                clientId: mainTask.clientId,
                assignedToId: assignedToId || null,
                mediaUrls: mediaUrls || [],
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
            }
        });

        // Optionally increment countSubTask on main task if not already handled
        await prisma.task.update({
            where: { id },
            data: { countSubTask: { increment: 1 } }
        });

        return NextResponse.json(subTask, { status: 201 });
    } catch (err) {
        console.error("[POST /api/tasks/:id/subtasks]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

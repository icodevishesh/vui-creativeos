import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";

// GET /api/tasks
// Query params: projectId, clientId, organizationId
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const clientId = searchParams.get("clientId");
        const organizationId = searchParams.get("organizationId");
        const assignedToId = searchParams.get("assignedToId");
        const calendarId = searchParams.get("calendarId");

        const where: any = {};
        if (projectId) where.projectId = projectId;
        if (clientId) where.clientId = clientId;
        if (organizationId) where.organizationId = organizationId;
        if (assignedToId) where.assignedToId = assignedToId;
        if (calendarId) where.calendarId = calendarId;

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: { select: { name: true } },
                client: { select: { companyName: true } },
                assignedTo: { select: { id: true, name: true } },
                _count: { select: { subTasks: true } },
                calendar: {
                    select: {
                        id: true,
                        name: true,
                        copies: { select: { status: true } },
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Strict aggregate status: task is only APPROVED when ALL copies are APPROVED/PUBLISHED
        const result = tasks.map((task) => {
            const calCopies = task.calendar?.copies ?? [];
            let effectiveStatus: string = task.status;
            if (calCopies.length > 0) {
                const allDone = calCopies.every(
                    (c) => c.status === 'APPROVED' || c.status === 'PUBLISHED'
                );
                if (!allDone && task.status === TaskStatus.APPROVED) {
                    effectiveStatus = 'INTERNAL_REVIEW';
                }
            }
            return {
                ...task,
                status: effectiveStatus,
                calendar: task.calendar
                    ? { id: task.calendar.id, name: task.calendar.name }
                    : null,
            };
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET /api/tasks]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            title,
            description,
            projectId,
            clientId,
            organizationId,
            assignedToId,
            priority,
            startDate,
            endDate,
            createdById,
            mediaUrls,
        } = body;

        if (!title || !projectId || !clientId || !organizationId || !createdById) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status: TaskStatus.OPEN,
                priority: priority || TaskPriority.MEDIUM,
                projectId,
                clientId,
                organizationId,
                assignedToId: assignedToId || null,
                createdById,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                mediaUrls: mediaUrls || [],
            },
            include: {
                project: { select: { name: true } },
                client: { select: { companyName: true } },
                assignedTo: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (err) {
        console.error("[POST /api/tasks]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

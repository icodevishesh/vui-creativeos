import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const tasks = await prisma.task.findMany({
            where: { project: { clientId } },
            include: { assignedTo: true, project: true },
        });

        // Map Prisma Task records to Schedule-X CalendarEvent structural interface
        const mappedEvents = tasks.map((task) => {
            // Reconstruct Schedule-X safe timestamp standard strings
            const startDateObj = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
            const endDateObj = task.completedAt ? new Date(task.completedAt) : startDateObj;
            
            // Format to YYYY-MM-DD HH:mm for simple events
            const formatTemporal = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 16);

            let calendarId = "task";
            if (task.priority === "URGENT" || task.priority === "HIGH") calendarId = "deadline";
            if (task.title.toLowerCase().includes("review")) calendarId = "review";
            if (task.title.toLowerCase().includes("meeting")) calendarId = "meeting";

            return {
                id: task.id,
                title: task.title,
                start: formatTemporal(startDateObj),
                end: formatTemporal(endDateObj),
                calendarId: calendarId,
                description: task.description || "",
                assignedTo: task.assignedToId || undefined,
            };
        });

        return NextResponse.json(mappedEvents);
    } catch (error) {
        console.error("[CALENDAR_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const body = await req.json();
        
        let project = await prisma.project.findFirst({
            where: { clientId },
        });

        if (!project) {
            // Find client to get their organization ID
            const client = await prisma.clientProfile.findUnique({
                where: { id: clientId }
            });
            
            if (!client) return new NextResponse("Client not found", { status: 404 });

            project = await prisma.project.create({
                data: {
                    name: "General",
                    clientId: clientId,
                    organizationId: client.organizationId,
                }
            });
        }

        // We require a 'createdById' for Task mapping, fallback to the owner of the organization ideally.
        // Assuming we pick the first user or pass it securely; here we fetch the client manager or owner
        const clientRef = await prisma.clientProfile.findUnique({
             where: {id: clientId},
             include: { organization: true }
        });
        const creatorId = clientRef?.managedBy || clientRef?.organization.ownerId;
        
        if (!creatorId) return new NextResponse("Admin identity gap", { status: 400 });

        // Build native Date objects securely handling "YYYY-MM-DD" or "YYYY-MM-DD HH:MM"
        const startRaw = String(body.start).trim();
        const endRaw = String(body.end).trim();
        const startString = startRaw.length === 10 ? `${startRaw}T09:00:00Z` : startRaw.replace(' ', 'T') + ':00Z';
        const endString = endRaw.length === 10 ? `${endRaw}T17:00:00Z` : endRaw.replace(' ', 'T') + ':00Z';

        const newTask = await prisma.task.create({
            data: {
                title: body.title || "Untitled Event",
                description: body.description || "",
                dueDate: new Date(startString),
                completedAt: startRaw === endRaw ? null : new Date(endString),
                status: TaskStatus.OPEN_TASK,
                priority: body.calendarId === "deadline" ? TaskPriority.URGENT : TaskPriority.MEDIUM,
                projectId: project.id,
                createdById: creatorId,
                assignedToId: body.assignedTo || null,
            }
        });

        // Translate the newly minted task back out specifically mapped for ScheduleX
        const formatTemporal = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 16);

        return NextResponse.json({
            id: newTask.id,
            title: newTask.title,
            start: formatTemporal(newTask.dueDate || newTask.createdAt),
            end: formatTemporal(newTask.completedAt || newTask.dueDate || newTask.createdAt),
            calendarId: body.calendarId,
            description: newTask.description,
            assignedTo: newTask.assignedToId
        });

    } catch (error) {
        console.error("[CALENDAR_POST]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

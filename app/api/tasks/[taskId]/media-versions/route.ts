import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                subTasks: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!task) {
            return new NextResponse("Task not found", { status: 404 });
        }

        // Get all media versions from task and sub-tasks
        const mediaVersions = [];

        // Add task media as version 0
        if (task.mediaUrls && task.mediaUrls.length > 0) {
            mediaVersions.push({
                version: 0,
                mediaUrls: task.mediaUrls,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                type: "task",
                isLatest: task.subTasks.length === 0
            });
        }

        // Add sub-task media as subsequent versions
        task.subTasks.forEach((subTask, index) => {
            if (subTask.mediaUrls && subTask.mediaUrls.length > 0) {
                mediaVersions.push({
                    version: index + 1,
                    mediaUrls: subTask.mediaUrls,
                    createdAt: subTask.createdAt,
                    updatedAt: subTask.updatedAt,
                    type: "subtask",
                    subTaskId: subTask.id,
                    subTaskTitle: subTask.title,
                    status: subTask.status,
                    feedbacks: subTask.feedbacks,
                    isLatest: index === 0 // Most recent sub-task is latest
                });
            }
        });

        return NextResponse.json({
            taskId,
            latestVersion: mediaVersions.length > 0 ? Math.max(...mediaVersions.map(v => v.version)) : 0,
            versions: mediaVersions
        });
    } catch (error) {
        console.error("[MEDIA_VERSIONS_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const body = await req.json();
        const { mediaUrls, title, description } = body;

        if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
            return new NextResponse("Media URLs are required", { status: 400 });
        }

        // Get the task to find project and client info
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: {
                projectId: true,
                clientId: true,
                organizationId: true
            }
        });

        if (!task) {
            return new NextResponse("Task not found", { status: 404 });
        }

        // Create a new sub-task for this media version
        const newSubTask = await prisma.subTask.create({
            data: {
                title: title || `Version ${Date.now()}`,
                description: description || "",
                mediaUrls: mediaUrls,
                status: "OPEN",
                mainTaskId: taskId,
                projectId: task.projectId,
                clientId: task.clientId
            },
            include: {
                assignedTo: true
            }
        });

        return NextResponse.json({
            success: true,
            subTask: newSubTask,
            message: "New media version created as sub-task"
        });
    } catch (error) {
        console.error("[MEDIA_VERSIONS_POST]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { TaskStatus } from "@prisma/client";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const body = await req.json();
        const { action, feedback, reviewerId, reviewerName, reviewerType } = body;

        if (!action || !["approve", "reject"].includes(action)) {
            return new NextResponse("Invalid action. Must be 'approve' or 'reject'", { status: 400 });
        }

        if (!reviewerId || !reviewerName || !reviewerType) {
            return new NextResponse("Reviewer information is required", { status: 400 });
        }

        // Get the current task
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

        // Determine the new status
        const newStatus = action === "approve" ? TaskStatus.APPROVED : TaskStatus.REJECTED;

        // Update the task status
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: newStatus,
                feedbacks: feedback ? [...(task.feedbacks || []), feedback] : task.feedbacks
            },
            include: {
                assignedTo: true,
                bucket: true
            }
        });

        // If there are sub-tasks, update the latest one with reviewer info
        if (task.subTasks.length > 0) {
            const latestSubTask = task.subTasks[0];
            await prisma.subTask.update({
                where: { id: latestSubTask.id },
                data: {
                    status: newStatus,
                    feedbacks: feedback ? [...(latestSubTask.feedbacks || []), feedback] : latestSubTask.feedbacks,
                    reviewerId: reviewerId,
                    reviewerName: reviewerName,
                    reviewerType: reviewerType as any,
                    endDate: new Date() // Mark completion date
                }
            });
        }

        // Log the activity
        await prisma.activityLog.create({
            data: {
                userId: reviewerId,
                action: `TASK_${action.toUpperCase()}`,
                entityType: "Task",
                entityId: taskId,
                metadata: {
                    taskTitle: task.title,
                    previousStatus: task.status,
                    newStatus: newStatus,
                    feedback: feedback,
                    reviewerName: reviewerName,
                    reviewerType: reviewerType
                }
            }
        });

        // Create notification for the task assignee
        if (task.assignedToId && task.assignedToId !== reviewerId) {
            await prisma.notification.create({
                data: {
                    userId: task.assignedToId,
                    type: action === "approve" ? "APPROVAL_REVIEWED" : "APPROVAL_REVIEWED",
                    title: `Task ${action === "approve" ? "Approved" : "Rejected"}`,
                    message: `Your task "${task.title}" was ${action === "approve" ? "approved" : "rejected"} by ${reviewerName}${feedback ? `. Feedback: "${feedback}"` : ""}`,
                    link: `/tasks/${taskId}`
                }
            });
        }

        return NextResponse.json({
            success: true,
            task: updatedTask,
            message: `Task ${action}d successfully`
        });
    } catch (error) {
        console.error("[APPROVAL_POST]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        // Get task with approval history
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignedTo: true,
                bucket: true,
                subTasks: {
                    include: {
                        assignedTo: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!task) {
            return new NextResponse("Task not found", { status: 404 });
        }

        // Get activity logs for this task
        const activityLogs = await prisma.activityLog.findMany({
            where: {
                entityType: "Task",
                entityId: taskId,
                action: {
                    in: ["TASK_APPROVE", "TASK_REJECT"]
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            task,
            approvalHistory: activityLogs
        });
    } catch (error) {
        console.error("[APPROVAL_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

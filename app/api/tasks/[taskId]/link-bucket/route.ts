import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const body = await req.json();
        const { bucketId } = body;

        if (!bucketId) {
            return new NextResponse("Bucket ID is required", { status: 400 });
        }

        // Verify the bucket exists
        const bucket = await prisma.contentBucket.findUnique({
            where: { id: bucketId }
        });

        if (!bucket) {
            return new NextResponse("Bucket not found", { status: 404 });
        }

        // Update the task to link it to the bucket
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { bucketId },
            include: {
                bucket: true,
                assignedTo: true,
                subTasks: {
                    include: {
                        assignedTo: true
                    }
                }
            }
        });

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("[LINK_BUCKET_POST]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        // Unlink the task from any bucket
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { bucketId: null },
            include: {
                bucket: true,
                assignedTo: true,
                subTasks: {
                    include: {
                        assignedTo: true
                    }
                }
            }
        });

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("[LINK_BUCKET_DELETE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

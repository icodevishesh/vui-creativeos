import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);

        const content = await prisma.writerContent.findUnique({
            where: { taskId: id },
        });

        return NextResponse.json(content || { content: "" });
    } catch (err) {
        console.error("[GET /api/tasks/:id/content]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const { content, status } = await req.json();

        // Upsert the content
        const writerContent = await prisma.writerContent.upsert({
            where: { taskId: id },
            update: { content },
            create: { taskId: id, content },
        });

        // If a status was provided (e.g., INTERNAL_REVIEW or IN_PROGRESS), update the parent task
        if (status) {
            await prisma.task.update({
                where: { id },
                data: { status },
            });
        }

        return NextResponse.json(writerContent);
    } catch (err) {
        console.error("[PATCH /api/tasks/:id/content]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

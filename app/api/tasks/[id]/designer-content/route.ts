import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        
        const content = await prisma.designerContent.findUnique({
            where: { taskId: id },
        });

        return NextResponse.json(content || { notes: "" });
    } catch (err) {
        console.error("[GET /api/tasks/:id/designer-content]", err);
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
        const { notes, status } = await req.json();

        // Upsert the content
        const designerContent = await prisma.designerContent.upsert({
            where: { taskId: id },
            update: { notes },
            create: { taskId: id, notes },
        });

        // If a status was provided (e.g., INTERNAL_REVIEW or IN_PROGRESS), update the parent task
        if (status) {
            await prisma.task.update({
                where: { id },
                data: { status },
            });
        }

        return NextResponse.json(designerContent);
    } catch (err) {
        console.error("[PATCH /api/tasks/:id/designer-content]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

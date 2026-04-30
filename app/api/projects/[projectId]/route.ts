import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        await prisma.project.delete({ where: { id: projectId } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[DELETE /api/projects/:projectId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await req.json();
        const { name, description, startDate, endDate, budget } = body;

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(budget !== undefined && { budget: budget ? Number(budget) : null }),
            },
            include: {
                client: { select: { companyName: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PATCH /api/projects/:projectId]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

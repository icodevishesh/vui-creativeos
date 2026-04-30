import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: "status is required" }, { status: 400 });
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: { status },
            include: {
                client: { select: { companyName: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PATCH /api/projects/:projectId/status]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

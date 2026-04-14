import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projects = await prisma.project.findMany({
            where: { clientId: id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(projects);
    } catch (err) {
        console.error("[GET /api/clients/:id/projects]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export enum ProjectStatus {
    PLANNING = "PLANNING",
    IN_PROGRESS = "IN_PROGRESS",
    REVIEW = "REVIEW",
    COMPLETED = "COMPLETED",
    ON_HOLD = "ON_HOLD",
    CANCELLED = "CANCELLED",
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, clientId, startDate, endDate, description, organizationId: bodyOrgId } =
            body;

        if (!name || !clientId) {
            return NextResponse.json(
                { error: "name and clientId are required" },
                { status: 400 }
            );
        }

        // Verify client exists
        const client = await prisma.clientProfile.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Use organizationId from client if not provided or to verify
        const finalOrgId = bodyOrgId || client.organizationId;

        if (bodyOrgId && bodyOrgId !== client.organizationId) {
            return NextResponse.json(
                { error: "Organization mismatch" },
                { status: 400 }
            );
        }

        const project = await prisma.project.create({
            data: {
                name,
                description: description ?? null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: ProjectStatus.PLANNING,
                clientId,
                organizationId: finalOrgId,
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (err) {
        console.error("[POST /api/projects]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// app/api/projects/[projectId]/route.ts
// DELETE /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────

// export async function DELETE(
//   _req: NextRequest,
//   { params }: { params: { projectId: string } }
// ) {
//   try {
//     await prisma.project.delete({ where: { id: params.projectId } });
//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error("[DELETE /api/projects/:id]", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// ─────────────────────────────────────────────────────────────────────────────
// app/api/projects/[projectId]/status/route.ts
// PATCH /api/projects/:id/status
// ─────────────────────────────────────────────────────────────────────────────

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: { projectId: string } }
// ) {
//   try {
//     const { status } = await req.json();
//     const updated = await prisma.project.update({
//       where: { id: params.projectId },
//       data: { status },
//     });
//     return NextResponse.json(updated);
//   } catch (err) {
//     console.error("[PATCH /api/projects/:id/status]", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

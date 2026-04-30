import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects
// Returns all projects across all clients
export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        companyName: true,
                    },
                },
                createdBy: {
                    select: { name: true },
                },
            },
        });

        return NextResponse.json(projects);
    } catch (err) {
        console.error("[GET /api/projects]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

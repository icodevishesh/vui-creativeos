import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust this path if your prisma client is elsewhere

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await prisma.clientProfile.findUnique({
            where: { id: id },
            select: { calendarObjective: true },
        });

        if (!client) return new NextResponse("Client not found", { status: 404 });

        return NextResponse.json({ objective: client.calendarObjective || "" });
    } catch (error) {
        console.error("[OBJECTIVE_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { objective } = body;

        const updatedClient = await prisma.clientProfile.update({
            where: { id: id },
            data: { calendarObjective: objective },
        });

        return NextResponse.json({ objective: updatedClient.calendarObjective });
    } catch (error) {
        console.error("[OBJECTIVE_PATCH]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
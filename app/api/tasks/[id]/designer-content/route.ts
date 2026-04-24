import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TaskStatus } from "@prisma/client";
import { saveFileToClientFolder } from "@/lib/storage/file-router";

/**
 * PATCH /api/tasks/[id]/designer-content
 *
 * Two usage modes detected by Content-Type:
 *
 * 1. application/json — simple status update
 *    Body: { status: "IN_PROGRESS" }
 *    Used when designer first opens the task (marks it as in-progress).
 *
 * 2. multipart/form-data — file upload + notes + submit for review
 *    Fields: file (repeat for multiple), notes (optional), status
 *    Saves files as TaskAttachment + Asset records, upserts DesignerContent,
 *    then sets task status to INTERNAL_REVIEW.
 */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await Promise.resolve(context.params);

        const task = await prisma.task.findUnique({
            where: { id },
            select: {
                id: true,
                clientId: true,
                calendarCopyId: true,
                client: { select: { companyName: true } },
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const contentType = req.headers.get("content-type") ?? "";

        // ── Mode 1: JSON status-only update (e.g. mark IN_PROGRESS on open) ──────
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { status } = body;

            if (!status) {
                return NextResponse.json({ error: "status is required" }, { status: 400 });
            }

            const updated = await prisma.task.update({
                where: { id },
                data: { status: status as TaskStatus },
            });

            return NextResponse.json(updated);
        }

        // ── Mode 2: FormData — file upload + notes + submit ──────────────────────
        const formData = await req.formData();
        const notes = (formData.get("notes") as string | null)?.trim() ?? "";
        const statusRaw = (formData.get("status") as string | null) ?? "INTERNAL_REVIEW";

        // Per-file type metadata: fileMetadata is a JSON map of
        // { [platform]: string[] } where each entry is an ordered list of types
        // matching the files appended for that platform.
        let fileMetadata: Record<string, string[]> = {};
        const rawMeta = formData.get("fileMetadata");
        if (typeof rawMeta === "string") {
            try { fileMetadata = JSON.parse(rawMeta); } catch { /* ignore */ }
        }

        // Legacy fallback: type_{Platform} entries
        const legacyTypes: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("type_") && typeof value === "string") {
                legacyTypes[key.slice(5)] = value;
            }
        }

        // Collect files — track per-platform index to resolve per-file types.
        const platformCursor: Record<string, number> = {};
        const allFiles: Array<{ file: File; platform: string | null; platformType: string | null }> = [];
        for (const [key, value] of formData.entries()) {
            if (!(value instanceof File)) continue;
            if (key === "file") {
                allFiles.push({ file: value, platform: null, platformType: null });
            } else if (key.startsWith("file_")) {
                const platform = key.slice(5);
                const idx = platformCursor[platform] ?? 0;
                platformCursor[platform] = idx + 1;
                const platformType =
                    fileMetadata[platform]?.[idx] ??
                    legacyTypes[platform] ??
                    null;
                allFiles.push({ file: value, platform, platformType });
            }
        }

        if (allFiles.length === 0 && !notes) {
            return NextResponse.json(
                { error: "Provide at least one file or design notes" },
                { status: 400 }
            );
        }

        // Upload files and create attachment records
        for (const { file, platform, platformType } of allFiles) {
            const { fileUrl } = await saveFileToClientFolder({
                file,
                clientId: task.clientId,
                companyName: task.client.companyName,
                uploadedById: user.id,
                taskId: id,
            });

            await prisma.taskAttachment.create({
                data: {
                    taskId: id,
                    fileName: file.name,
                    fileUrl,
                    fileSize: file.size,
                    mimeType: file.type || "application/octet-stream",
                    ...(platform ? { platform } : {}),
                    ...(platformType ? { platformType } : {}),
                },
            });
        }

        // Upsert designer notes
        if (notes) {
            await prisma.designerContent.upsert({
                where: { taskId: id },
                create: { taskId: id, notes },
                update: { notes },
            });
        }

        // Update task status (default: INTERNAL_REVIEW)
        const updated = await prisma.task.update({
            where: { id },
            data: { status: statusRaw as TaskStatus },
            include: {
                attachments: true,
                designerContent: true,
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PATCH /api/tasks/:id/designer-content]", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

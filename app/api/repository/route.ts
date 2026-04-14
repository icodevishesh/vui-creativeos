import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // 1. Fetch Clients with aggregate file counts from their tasks
    const clients = await prisma.clientProfile.findMany({
      select: {
        id: true,
        companyName: true,
        tasks: {
          select: {
            _count: {
              select: {
                attachments: true,
              },
            },
          },
        },
      },
    });

    const folders = clients.map((client) => {
      const fileCount = client.tasks.reduce((sum, task) => sum + task._count.attachments, 0);
      return {
        id: client.id,
        name: client.companyName,
        fileCount,
      };
    });

    // 2. Fetch Recent Files across all tasks
    const recentAttachments = await prisma.taskAttachment.findMany({
      take: 20,
      orderBy: {
        uploadedAt: "desc",
      },
      include: {
        task: {
          select: {
            client: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    const recentFiles = recentAttachments.map((att) => ({
      id: att.id,
      name: att.fileName,
      clientName: att.task.client.companyName,
      size: att.fileSize,
      date: att.uploadedAt,
      url: att.fileUrl,
      mimeType: att.mimeType,
    }));

    return NextResponse.json({
      folders,
      recentFiles,
    });
  } catch (error) {
    console.error("[REPOSITORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { saveFileToClientFolder } from '@/lib/storage/file-router';

/**
 * GET /api/tasks/[id]/attachments
 * Returns all TaskAttachment records for a task.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(attachments);
  } catch (err) {
    console.error('[GET /api/tasks/:id/attachments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[id]/attachments
 *
 * Accepts multipart/form-data with one or more `file` fields.
 * Each file is:
 *   1. Saved to the task's client folder under docs/uploads/[client]/
 *   2. Recorded as a TaskAttachment (linked to the task)
 *   3. Recorded as an Asset (shared repository entry)
 *
 * Form fields:
 *   file  — one or more files (repeat the field for multiple uploads)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await Promise.resolve(context.params);

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        client: { select: { companyName: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const created: object[] = [];

    for (const file of files) {
      const { asset, fileUrl } = await saveFileToClientFolder({
        file,
        clientId: task.clientId,
        companyName: task.client.companyName,
        uploadedById: user.id,
      });

      // Also create a TaskAttachment so the task detail view can reference it
      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId: id,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        },
      });

      created.push({ attachment, asset });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks/:id/attachments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

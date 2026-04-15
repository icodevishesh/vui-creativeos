import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { saveFileToClientFolder } from '@/lib/storage/file-router';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);

    const content = await prisma.designerContent.findUnique({
      where: { taskId: id },
    });

    return NextResponse.json(content || { notes: '' });
  } catch (err) {
    console.error('[GET /api/tasks/:id/designer-content]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/tasks/[id]/designer-content
 *
 * Accepts either:
 *   multipart/form-data — file(s), notes?, status?
 *     → saves each file to docs/uploads/[client]/, creates TaskAttachment + Asset records,
 *       upserts DesignerContent notes, and optionally updates task status
 *   application/json   — { notes?, status? }
 *     → upserts DesignerContent notes and/or updates task status (existing behavior)
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      // ── File upload + submit path ───────────────────────────────────
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await req.formData();
      const files = formData.getAll('file') as File[];
      const notes = (formData.get('notes') as string | null) ?? undefined;
      const status = (formData.get('status') as string | null) ?? undefined;

      const savedFiles: object[] = [];

      for (const file of files) {
        const { asset, fileUrl } = await saveFileToClientFolder({
          file,
          clientId: task.clientId,
          companyName: task.client.companyName,
          uploadedById: user.id,
        });

        const attachment = await prisma.taskAttachment.create({
          data: {
            taskId: id,
            fileName: file.name,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
          },
        });

        savedFiles.push({ attachment, asset });
      }

      const designerContent = await prisma.designerContent.upsert({
        where: { taskId: id },
        update: { notes },
        create: { taskId: id, notes },
      });

      if (status) {
        await prisma.task.update({ where: { id }, data: { status: status as TaskStatus } });
      }

      return NextResponse.json({ designerContent, attachments: savedFiles });
    }

    // ── JSON path (status-only or notes-only update) ─────────────────
    const { notes, status } = await req.json();

    const designerContent = await prisma.designerContent.upsert({
      where: { taskId: id },
      update: { notes },
      create: { taskId: id, notes },
    });

    if (status) {
      await prisma.task.update({ where: { id }, data: { status: status as TaskStatus } });
    }

    return NextResponse.json(designerContent);
  } catch (err) {
    console.error('[PATCH /api/tasks/:id/designer-content]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

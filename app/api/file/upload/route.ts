import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ensureClientFolder, sanitizeFolderName } from '@/lib/storage/file-router';

/**
 * POST /api/file/upload
 *
 * Generic file upload. When `clientId` is supplied the file is routed to
 * the client's designated folder and an Asset record is written (shared with
 * Creative Upload and the File Repository). Without `clientId` the legacy
 * `folderName` param is used and no Asset record is written.
 *
 * Form fields:
 *   file       — required
 *   clientId   — preferred: routes to client folder + writes Asset record
 *   folderName — legacy fallback when clientId is absent
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const clientId = (formData.get('clientId') as string | null)?.trim() || null;
    const folderName = (formData.get('folderName') as string | null) || 'general';

    let uploadDir: string;
    let safeFolderName: string;

    if (clientId) {
      // Route to the client's designated folder
      const client = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        select: { id: true, companyName: true },
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      uploadDir = await ensureClientFolder(client.id, client.companyName);
      safeFolderName = sanitizeFolderName(client.companyName);
    } else {
      // Legacy: use provided folderName
      safeFolderName = sanitizeFolderName(folderName);
      uploadDir = path.join(process.cwd(), 'docs', 'uploads', safeFolderName);
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Write file to disk
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    const reader = file.stream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await fs.appendFile(filePath, Buffer.from(value));
    }

    const fileUrl = `/uploads/${safeFolderName}/${uniqueFileName}`;

    // Write Asset record when clientId is provided
    if (clientId) {
      const user = await getCurrentUser();
      if (user) {
        await prisma.asset.create({
          data: {
            assetName: file.name,
            fileUrl,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            clientId,
            uploadedById: user.id,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      path: filePath,
      url: fileUrl,
      size: file.size,
      name: file.name,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
